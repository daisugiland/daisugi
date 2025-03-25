import type { AsyncFn } from './types.js';
import { urandom } from './urandom.js';

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

  return task
    .fn(...task.args)
    .then((value) => {
      const taskIndex = tasks.findIndex(
        (t) => t.id === task.id,
      );
      tasks.splice(taskIndex, 1);
      task.resolve(value);
      const nextTask = tasks.find(
        (t) => t.state === State.Waiting,
      );
      if (nextTask) {
        runTask(nextTask, tasks);
      }
    })
    .catch((reason) => {
      const taskIndex = tasks.findIndex(
        (t) => t.id === task.id,
      );
      tasks.splice(taskIndex, 1);
      task.reject(reason);
      const nextTask = tasks.find(
        (t) => t.state === State.Waiting,
      );
      if (nextTask) {
        runTask(nextTask, tasks);
      }
    });
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
        id: urandom(),
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
    opts.concurrencyCount || defaultConcurrencyCount;
  const tasks: Task[] = [];
  return {
    withPool(fn: AsyncFn) {
      return withPoolCreator(fn, tasks, concurrencyCount);
    },
  };
}

export function withPool(
  fn: AsyncFn,
  opts: WithPoolOpts = {},
) {
  const concurrencyCount =
    opts.concurrencyCount || defaultConcurrencyCount;
  const tasks: Task[] = [];
  return withPoolCreator(fn, tasks, concurrencyCount);
}
