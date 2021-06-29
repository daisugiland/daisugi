import { result } from './result';

export const TIMEOUT_EXCEPTION_CODE = 'OUMI:TIMEOUT';

const MAX_TIME_MS = 200;
const exception = {
  code: TIMEOUT_EXCEPTION_CODE,
};

function fnWithTimeout(asyncFn, args) {
  const timeout = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(result.fail(exception));
    }, MAX_TIME_MS);

    // TODO: clearTimeout
    // TODO: cancel request
  });

  return Promise.race([timeout, asyncFn(...args)]);
}

export function withTimeout(asyncFn) {
  return function (...args) {
    return fnWithTimeout(asyncFn, args);
  };
}
