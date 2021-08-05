import { Result, result } from './result';
import { Code } from './Code';
import { Fn } from './types';

interface Options {
  volumeThreshold?: number;
  failureThresholdPercent?: number;
  returnToServiceAfterMs?: number;
}

const RETURN_TO_SERVICE_AFTER_MS = 3500;
const FAILURE_THRESHOLD_PERCENT = 30;
const VOLUME_THRESHOLD = 10;

const exception = {
  code: Code.CircuitSuspended,
};

const breakerState = {
  green: 'green',
  red: 'red',
  yellow: 'yellow',
};

export function createWithCircuitBreaker(
  options: Options = {},
) {
  const volumeThreshold =
    options.volumeThreshold || VOLUME_THRESHOLD;
  const failureThresholdPercent =
    options.failureThresholdPercent ||
    FAILURE_THRESHOLD_PERCENT;
  const returnToServiceAfterMs =
    options.returnToServiceAfterMs ||
    RETURN_TO_SERVICE_AFTER_MS;

  let nextAttemptMs = Date.now();
  let state = breakerState.green;
  let calls = 0;
  let failures = 0;

  return function withCircuitBreaker(fn: Fn) {
    return async function (...args) {
      if (state === breakerState.red) {
        if (nextAttemptMs <= Date.now()) {
          state = breakerState.yellow;
        } else {
          return result.fail(exception);
        }
      }

      calls = calls + 1;

      const response: Result = await fn.apply(this, args);

      if (response.isSuccess) {
        return response;
      }

      failures = response.isFailure
        ? failures + 1
        : failures - 1;

      if (calls < volumeThreshold) {
        return response;
      }

      const failuresRate = (failures / calls) * 100;

      if (
        failuresRate > failureThresholdPercent ||
        state === breakerState.yellow
      ) {
        state = breakerState.red;

        nextAttemptMs = Date.now() + returnToServiceAfterMs;
      }
    };
  };
}
