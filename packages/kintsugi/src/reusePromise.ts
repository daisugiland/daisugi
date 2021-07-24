import { MemoryStore } from './MemoryStore';
import { ResultAsyncFn } from './types';

export function reusePromise(asyncFn: ResultAsyncFn) {
  const memoryStore = new MemoryStore();

  return async function (...args) {
    const cacheKey = JSON.stringify(args);

    let response = memoryStore.get(cacheKey);

    if (typeof response === 'undefined') {
      response = asyncFn.apply(this, args).then(
        (value) => {
          memoryStore.delete(cacheKey);

          return value;
        },
        (error) => {
          memoryStore.delete(cacheKey);

          throw error;
        },
      );

      memoryStore.set(cacheKey, response);
    }

    return response;
  };
}
