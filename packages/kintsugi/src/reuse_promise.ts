import { SimpleMemoryStore } from './simple_memory_store.js';
import { stringifyArgs } from './stringify_args.js';
import type { AsyncFn } from './types.js';

export function reusePromise<Fn extends AsyncFn>(fn: Fn) {
  const simpleMemoryStore = new SimpleMemoryStore();

  // eslint-disable-next-line require-await
  return async function (
    this: unknown,
    ...args: Parameters<Fn>
  ): Promise<Awaited<ReturnType<Fn>>> {
    const cacheKey = stringifyArgs(args);
    const cacheResponse = simpleMemoryStore.get(cacheKey);
    if (cacheResponse.isSuccess) {
      return cacheResponse.getValue() as Promise<
        Awaited<ReturnType<Fn>>
      >;
    }
    const response = fn.apply(this, args).then(
      (value) => {
        simpleMemoryStore.delete(cacheKey);
        return value;
      },
      (reason) => {
        simpleMemoryStore.delete(cacheKey);
        throw reason;
      },
    );
    simpleMemoryStore.set(cacheKey, response);
    return response;
  };
}
