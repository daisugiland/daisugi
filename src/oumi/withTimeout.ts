import { result } from './result';

export const TIMEOUT_EXCEPTION_CODE = 'OUMI:TIMEOUT';

const maxTimeMs = 200;
const exception = {
  code: TIMEOUT_EXCEPTION_CODE,
};

function fnWithTimeout(asyncFn, args) {
  const timeout = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(result.fail(exception));
    }, maxTimeMs);
  });

  return Promise.race([timeout, asyncFn(...args)]);
}

export function withTimeout(asyncFn) {
  return function (...args) {
    return fnWithTimeout(asyncFn, args);
  };
}
