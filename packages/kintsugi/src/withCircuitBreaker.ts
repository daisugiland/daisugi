import { result } from './result';
import {
  AsyncFn,
  WithCircuitBreakerOptions,
} from './types';

const RETURN_TO_SERVICE_AFTER_MS = 3500;
const FAILURE_THRESHOLD_PERCENT = 30;
const SAMPLES = 10;

export const CIRCUIT_SUSPENDED_EXCEPTION_CODE =
  'OUMI:CIRCUIT_SUSPENDED';

const exception = {
  code: CIRCUIT_SUSPENDED_EXCEPTION_CODE,
};

const breakerState = {
  green: 'green',
  red: 'red',
  yellow: 'yellow',
};

function sumBooleans(booleans) {
  return booleans.reduce((a, b) => a + (b ? 0 : 1), 0);
}

export function createWithCircuitBreaker({
  samples = SAMPLES,
  failureThresholdPercent = FAILURE_THRESHOLD_PERCENT,
  returnToServiceAfterMs = RETURN_TO_SERVICE_AFTER_MS,
}: WithCircuitBreakerOptions = {}) {
  let nextAttemptMs = Date.now();
  let state = breakerState.green;
  const calls = [];

  return function withCircuitBreaker(fn: AsyncFn) {
    return async function (...args) {
      if (state === breakerState.red) {
        if (nextAttemptMs <= Date.now()) {
          state = breakerState.green;
        } else {
          return result.fail(exception);
        }
      }

      const response = await fn(...args);

      calls.push(response.isSuccess);

      if (calls.length > samples) {
        calls.shift();

        if (
          (sumBooleans(calls) * 100) / samples >
          failureThresholdPercent
        ) {
          state = breakerState.red;

          nextAttemptMs =
            Date.now() + returnToServiceAfterMs;
        }
      }

      return response;
    };
  };
}
