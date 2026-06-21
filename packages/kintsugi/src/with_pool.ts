import type { AsyncFn, WrappedFn } from './types.js';

interface WithPoolOpts {
  concurrencyCount?: number;
}

interface Task {
  fn: AsyncFn;
  args: any[];
  resolve(value: any): void;
  reject(reason?: any): void;
}

const defaultConcurrencyCount = 2;

function createScheduler(concurrencyCount: number) {
  // Pending tasks live in a FIFO queue advanced by a `head` pointer, so dequeuing
  // is O(1) (no `splice`/`indexOf` scan per settle). Running tasks aren't tracked;
  // only `runningCount` gates concurrency, keeping scheduling linear, not quadratic.
  const queue: Task[] = [];
  let head = 0;
  let runningCount = 0;

  function runTask(task: Task) {
    // Invoke `fn` synchronously so the task starts right away; normalize via
    // `Promise.resolve` so a non-thenable return still settles, and catch a sync
    // throw so its slot is freed. After each settle, `pump` re-drives the next task.
    try {
      Promise.resolve(task.fn(...task.args)).then(
        (value) => {
          runningCount -= 1;
          task.resolve(value);
          pump();
        },
        (reason) => {
          runningCount -= 1;
          task.reject(reason);
          pump();
        },
      );
    } catch (reason) {
      // Slot is freed by the decrement; the `pump` loop that invoked this
      // picks up the next pending task on its next iteration.
      runningCount -= 1;
      task.reject(reason);
    }
  }

  function pump() {
    while (
      runningCount < concurrencyCount &&
      head < queue.length
    ) {
      // `head < queue.length` is guaranteed by the loop condition, and the
      // slot is never nulled until after it is read here.
      const task = queue[head] as Task;
      // Release the reference so a settled task can be GC'd before the queue
      // is compacted.
      queue[head] = undefined as any;
      head += 1;
      runningCount += 1;
      // Compact occasionally so `queue` (and `head`) don't grow unbounded for
      // long-lived pools.
      if (head > 1024 && head * 2 >= queue.length) {
        queue.splice(0, head);
        head = 0;
      }
      runTask(task);
    }
  }

  return function schedule(fn: AsyncFn, args: any[]) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, args, resolve, reject });
      pump();
    });
  };
}

export function createWithPool(opts: WithPoolOpts = {}) {
  const schedule = createScheduler(
    opts.concurrencyCount ?? defaultConcurrencyCount,
  );
  return {
    withPool<Fn extends AsyncFn>(fn: Fn) {
      return ((...args: any[]) =>
        schedule(fn, args)) as WrappedFn<Fn>;
    },
  };
}

export function withPool<Fn extends AsyncFn>(
  fn: Fn,
  opts: WithPoolOpts = {},
): WrappedFn<Fn> {
  return createWithPool(opts).withPool(fn);
}
