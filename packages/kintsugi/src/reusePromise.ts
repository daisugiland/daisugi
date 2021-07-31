import { SimpleMemoryStore } from './SimpleMemoryStore';
import { AsyncFn } from './types';

export function reusePromise(asyncFn: AsyncFn) {
  const simpleMemoryStore = new SimpleMemoryStore();

  return async function (...args) {
    const cacheKey = JSON.stringify(args);

    const cacheResponse = simpleMemoryStore.get(cacheKey);

    if (cacheResponse.isSuccess) {
      return cacheResponse.value;
    }

    const response = asyncFn.apply(this, args).then(
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
