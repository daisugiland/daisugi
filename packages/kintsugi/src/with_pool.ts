import type { AsyncFn } from './types.js';

interface WithPoolOpts {
  concurrencyCount?: number;
}

interface Task {
  fn: AsyncFn;
  id: string;
  args: any[];
  resolve(value: any): void;
  reject(reason?: any): void;
  state: State;
}

const defaultConcurrencyCount = 2;

enum State {
  Waiting = 0,
  Running = 1,
}

function runTask(task: Task, tasks: Task[]) {
  task.state = State.Running;

  function settle(settleTask: () => void): void {
    const taskIndex = tasks.findIndex(
      (t) => t.id === task.id,
    );
    tasks.splice(taskIndex, 1);
    settleTask();
    const nextTask = tasks.find(
      (t) => t.state === State.Waiting,
    );
    if (nextTask) {
      runTask(nextTask, tasks);
    }
  }

  // Invoke `fn` synchronously so the task starts right away, but normalize the
  // result with `Promise.resolve` so a non-thenable return still settles, and
  // catch a synchronous throw so its slot is freed instead of being stranded.
  try {
    return Promise.resolve(task.fn(...task.args)).then(
      (value) => settle(() => task.resolve(value)),
      (reason) => settle(() => task.reject(reason)),
    );
  } catch (reason) {
    settle(() => task.reject(reason));
  }
}

function withPoolCreator(
  fn: AsyncFn,
  tasks: Task[],
  concurrencyCount: number,
) {
  return (...args: any[]) =>
    new Promise((resolve, reject) => {
      const task = {
        fn,
        id: globalThis.crypto.randomUUID(),
        args,
        resolve,
        reject,
        state: State.Waiting,
      };
      tasks.push(task);
      const runningTasks = tasks.filter(
        ({ state }) => state === State.Running,
      );
      if (runningTasks.length < concurrencyCount) {
        runTask(task, tasks);
      }
    });
}

export function createWithPool(opts: WithPoolOpts = {}) {
  const concurrencyCount =
    opts.concurrencyCount ?? defaultConcurrencyCount;
  const tasks: Task[] = [];
  return {
    withPool<Fn extends AsyncFn>(fn: Fn) {
      return withPoolCreator(
        fn,
        tasks,
        concurrencyCount,
      ) as (...args: Parameters<Fn>) => ReturnType<Fn>;
    },
  };
}

export function withPool<Fn extends AsyncFn>(
  fn: Fn,
  opts: WithPoolOpts = {},
): (...args: Parameters<Fn>) => ReturnType<Fn> {
  const concurrencyCount =
    opts.concurrencyCount ?? defaultConcurrencyCount;
  const tasks: Task[] = [];
  return withPoolCreator(fn, tasks, concurrencyCount) as (
    ...args: Parameters<Fn>
  ) => ReturnType<Fn>;
}
