import type { AsyncFn } from './types.js';

interface WithPoolOpts {
  concurrencyCount?: number;
}

interface Task {
  fn: AsyncFn;
  args: any[];
  resolve(value: any): void;
  reject(reason?: any): void;
  state: State;
}

type WrappedFn<Fn extends AsyncFn> = (
  ...args: Parameters<Fn>
) => Promise<Awaited<ReturnType<Fn>>>;

const defaultConcurrencyCount = 2;

enum State {
  Waiting = 0,
  Running = 1,
}

function createScheduler(concurrencyCount: number) {
  const tasks: Task[] = [];
  let runningCount = 0;

  function runTask(task: Task) {
    task.state = State.Running;
    runningCount += 1;

    function settle(settleTask: () => void): void {
      tasks.splice(tasks.indexOf(task), 1);
      runningCount -= 1;
      settleTask();
      const nextTask = tasks.find(
        (candidate) => candidate.state === State.Waiting,
      );
      if (nextTask) {
        runTask(nextTask);
      }
    }

    // Invoke `fn` synchronously so the task starts right away, but normalize
    // the result with `Promise.resolve` so a non-thenable return still
    // settles, and catch a synchronous throw so its slot is freed instead of
    // being stranded.
    try {
      return Promise.resolve(task.fn(...task.args)).then(
        (value) => settle(() => task.resolve(value)),
        (reason) => settle(() => task.reject(reason)),
      );
    } catch (reason) {
      settle(() => task.reject(reason));
    }
  }

  return function schedule(fn: AsyncFn, args: any[]) {
    return new Promise((resolve, reject) => {
      const task: Task = {
        fn,
        args,
        resolve,
        reject,
        state: State.Waiting,
      };
      tasks.push(task);
      if (runningCount < concurrencyCount) {
        runTask(task);
      }
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
  const schedule = createScheduler(
    opts.concurrencyCount ?? defaultConcurrencyCount,
  );
  return ((...args: any[]) =>
    schedule(fn, args)) as WrappedFn<Fn>;
}
