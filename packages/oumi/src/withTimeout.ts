import { result } from './result';
import { WithTimeoutOptions, AsyncFn } from './types';

export const TIMEOUT_EXCEPTION_CODE = 'OUMI:TIMEOUT';

const MAX_TIME_MS = 200;
const exception = {
  code: TIMEOUT_EXCEPTION_CODE,
};

function fnWithTimeout(
  fn: AsyncFn,
  args: any[],
  maxTimeMs: number,
) {
  const promise = fn(...args);
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
}

export function createWithTimeout(
  parentOptions: WithTimeoutOptions,
) {
  return function (fn: AsyncFn, options = parentOptions) {
    return withTimeout(fn, options);
  };
}

export function withTimeout(
  fn: AsyncFn,
  // TODO: cancel request
  { maxTimeMs = MAX_TIME_MS }: WithTimeoutOptions = {},
) {
  return async function (...args) {
    return fnWithTimeout(fn, args, maxTimeMs);
  };
}
