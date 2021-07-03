import { result } from './result';
import {
  AsyncFn,
  WithCircuitBreakerOptions,
} from './types';

const FAILURE_THRESHOLD = 3;
const SUCCESS_THRESHOLD = 2;
const TIMEOUT_MS = 3500;

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

export function withCircuitBreaker(
  fn: AsyncFn,
  {
    failureThreshold = FAILURE_THRESHOLD,
    successThreshold = SUCCESS_THRESHOLD,
    timeoutMs = TIMEOUT_MS,
  }: WithCircuitBreakerOptions = {},
) {
  let failureCount = 0;
  let successCount = 0;
  let nextAttemptMs = Date.now();
  let state = breakerState.green;

  return async (...args) => {
    if (state === breakerState.red) {
      if (nextAttemptMs <= Date.now()) {
        state = breakerState.yellow;
      } else {
        return result.fail(exception);
      }
    }

    const response = await fn(...args);

    if (response.isSuccess) {
      failureCount = 0;

      if (state === breakerState.yellow) {
        successCount += 1;

        if (successCount > successThreshold) {
          successCount = 0;

          state = breakerState.green;
        }
      }

      return response;
    }

    if (response.isFailure) {
      failureCount += 1;

      if (failureCount >= failureThreshold) {
        state = breakerState.red;

        nextAttemptMs = Date.now() + timeoutMs;
      }

      return response;
    }
  };
}
