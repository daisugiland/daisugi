import { stringifyArgs } from './stringify_args.js';
import type { AsyncFn } from './types.js';

export function reusePromise<Fn extends AsyncFn>(fn: Fn) {
  // In-flight de-duplication only: a plain Map of pending promises, each
  // cleared once it settles. No Result/Ayamari allocation on the miss path.
  const inFlight = new Map<
    string,
    Promise<Awaited<ReturnType<Fn>>>
  >();

  return function (
    this: unknown,
    ...args: Parameters<Fn>
  ): Promise<Awaited<ReturnType<Fn>>> {
    const cacheKey = stringifyArgs(args);
    const pending = inFlight.get(cacheKey);
    if (pending !== undefined) {
      return pending;
    }
    const response = (
      fn.apply(this, args) as Promise<
        Awaited<ReturnType<Fn>>
      >
    ).then(
      (value) => {
        inFlight.delete(cacheKey);
        return value;
      },
      (reason: unknown) => {
        inFlight.delete(cacheKey);
        throw reason;
      },
    );
    inFlight.set(cacheKey, response);
    return response;
  };
}
