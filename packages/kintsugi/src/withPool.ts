import { randomU32 } from './randomU32';
import { AsyncFn } from './types';

interface Options {
  concurrencyCount?: number;
}

interface Task {
  fn: AsyncFn;
  id: number;
  args: unknown[];
  resolve(value: unknown): void;
  reject(reason?: any): void;
  state: State;
}

const CONCURRENCY_COUNT = 2;

enum State {
  Waiting,
  Running,
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
  return function (...args: unknown[]) {
    return new Promise((resolve, reject) => {
      const task = {
        fn,
        id: randomU32(),
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
  };
}

export function createWithPool(options: Options = {}) {
  const concurrencyCount =
    options.concurrencyCount || CONCURRENCY_COUNT;

  const tasks: Task[] = [];

  return {
    withPool(fn: AsyncFn) {
      return withPoolCreator(fn, tasks, concurrencyCount);
    },
  };
}

export function withPool(
  fn: AsyncFn,
  options: Options = {},
) {
  const concurrencyCount =
    options.concurrencyCount || CONCURRENCY_COUNT;

  const tasks: Task[] = [];

  return withPoolCreator(fn, tasks, concurrencyCount);
}
