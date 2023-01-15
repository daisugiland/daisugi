import { Result } from '@daisugi/anzen';

import { Code } from './code.js';
import type { AsyncFn } from './types.js';

const MAX_TIME_MS = 600;
const exception = Result.failure({ code: Code.Timeout });

interface WithTimeoutOpts {
  maxTimeMs?: number;
}

export function withTimeout(
  fn: AsyncFn,
  opts: WithTimeoutOpts = {},
) {
  const maxTimeMs = opts.maxTimeMs || MAX_TIME_MS;
  return async function (this: unknown, ...args: any[]) {
    const promise = fn.apply(this, args);
    const timeout = new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(exception);
      }, maxTimeMs);
      //This will handle the promise (and makes possible unhandled-rejection warnings away) to avoid breaking on errors, but you should still handle this promise!
      promise
        .catch(() => {})
        .then(() => clearTimeout(timeoutId));
    });
    return Promise.race([timeout, promise]);
  };
}
