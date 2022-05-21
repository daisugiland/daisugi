import { SimpleMemoryStore } from './simple_memory_store.js';
import { stringifyArgs } from './stringify_args.js';
import { AsyncFn } from './types.js';

export function reusePromise(fn: AsyncFn) {
  const simpleMemoryStore = new SimpleMemoryStore();

  return async function (this: unknown, ...args: any[]) {
    const cacheKey = stringifyArgs(args) as string;
    const cacheResponse = simpleMemoryStore.get(cacheKey);
    if (cacheResponse.isSuccess) {
      return cacheResponse.value;
    }
    const response = fn
      .apply(this, args)
      .then(
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
