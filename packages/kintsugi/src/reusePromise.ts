import { SimpleMemoryStore } from './SimpleMemoryStore';
import { stringify } from './stringify';
import { Fn } from './types';

export function reusePromise(fn: Fn) {
  const simpleMemoryStore = new SimpleMemoryStore();

  return async function (...args) {
    const cacheKey = stringify(args);

    const cacheResponse = simpleMemoryStore.get(cacheKey);

    if (cacheResponse.isSuccess) {
      return cacheResponse.value;
    }

    const response = fn.apply(this, args).then(
      (value) => {
        simpleMemoryStore.delete(cacheKey);

        return value;
      },
      (error) => {
        simpleMemoryStore.delete(cacheKey);

        throw error;
      },
    );

    simpleMemoryStore.set(cacheKey, response);

    return response;
  };
}
