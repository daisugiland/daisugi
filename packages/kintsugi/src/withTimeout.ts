import { result } from './result';
import { AsyncFn } from './types';
import { Code } from './Code';

const MAX_TIME_MS = 600;
const exception = {
  code: Code.Timeout,
};

interface WithTimeoutOptions {
  maxTimeMs?: number;
}

export function withTimeout(
  fn: AsyncFn,
  { maxTimeMs = MAX_TIME_MS }: WithTimeoutOptions = {},
) {
  return async function (...args) {
    const promise = fn.apply(this, args);
    const timeout = new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(result.fail(exception));
      }, maxTimeMs);

      //This will handle the promise (and makes possible unhandled-rejection warnings away) to avoid breaking on errors, but you should still handle this promise!
      promise
        .catch(() => {})
        .then(() => clearTimeout(timeoutId));
    });

    return Promise.race([timeout, promise]);
  };
}
