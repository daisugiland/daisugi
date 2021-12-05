import { SimpleMemoryStore } from './SimpleMemoryStore';
import { stringifyArgs } from './stringifyArgs';
import { AsyncFn } from './types';

export function reusePromise(fn: AsyncFn) {
  const simpleMemoryStore = new SimpleMemoryStore();

  return async function (...args: any[]) {
    const cacheKey = stringifyArgs(args) as string;

    const cacheResponse = simpleMemoryStore.get(cacheKey);

    if (cacheResponse.isSuccess) {
      return cacheResponse.value;
    }

    const response = fn(args).then(
      (value: any) => {
        simpleMemoryStore.delete(cacheKey);

        return value;
      },
      (reason: any) => {
        simpleMemoryStore.delete(cacheKey);

        throw reason;
      },
    );

    simpleMemoryStore.set(cacheKey, response);

    return response;
  };
}
