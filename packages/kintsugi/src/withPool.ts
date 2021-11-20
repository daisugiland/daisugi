import { randomU32 } from './randomU32';
import { Fn } from './types';

interface Options {
  concurrencyCount?: number;
}

const CONCURRENCY_COUNT = 2;

enum State {
  Waiting,
  Running,
}

function runTask(task, tasks) {
  task.state = State.Running;

  return task.fn
    .apply(this, task.args)
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
    .catch((error) => {
      const taskIndex = tasks.findIndex(
        (t) => t.id === task.id,
      );
      tasks.splice(taskIndex, 1);

      task.reject(error);

      const nextTask = tasks.find(
        (t) => t.state === State.Waiting,
      );

      if (nextTask) {
        runTask(nextTask, tasks);
      }
    });
}

function withPoolCreator(fn, tasks, concurrencyCount) {
  return function (...args) {
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

  const tasks = [];

  return {
    withPool(fn) {
      return withPoolCreator(fn, tasks, concurrencyCount);
    },
  };
}

export function withPool(fn: Fn, options: Options = {}) {
  const concurrencyCount =
    options.concurrencyCount || CONCURRENCY_COUNT;

  const tasks = [];

  return withPoolCreator(fn, tasks, concurrencyCount);
}
