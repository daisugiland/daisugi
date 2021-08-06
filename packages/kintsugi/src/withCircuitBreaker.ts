import { Result, result } from './result';
import { Code } from './Code';
import { Fn } from './types';
import { setInterval } from 'timers';

interface Options {
  windowDurationMs?: number;
  totalBuckets?: number;
  failureThresholdRate?: number;
  volumeThreshold?: number;
  returnToServiceAfterMs?: number;
  isFailureResponse?(response: Result): boolean;
}

const WINDOW_DURATION_MS = 30000;
const TOTAL_BUCKETS = 10;
const FAILURE_THRESHOLD_RATE = 50;
const VOLUME_THRESHOLD = 10;
const RETURN_TO_SERVICE_AFTER_MS = 5000;

const state = {
  close: 0,
  open: 1,
  halfOpen: 2,
};

const measure = {
  failure: 0,
  calls: 1,
};

const exception = {
  code: Code.CircuitSuspended,
};

export function isFailureResponse(response: Result) {
  if (response.isSuccess) {
    return false;
  }

  if (
    response.isFailure &&
    response.error.code === Code.NotFound
  ) {
    return false;
  }

  return true;
}

export function withCircuitBreaker(
  fn: Fn,
  options: Options = {},
) {
  const windowDurationMs =
    options.windowDurationMs || WINDOW_DURATION_MS;
  const totalBuckets =
    options.totalBuckets || TOTAL_BUCKETS;
  const failureThresholdRate =
    options.failureThresholdRate || FAILURE_THRESHOLD_RATE;
  const volumeThreshold =
    options.volumeThreshold || VOLUME_THRESHOLD;
  const _isFailureResponse =
    options.isFailureResponse || isFailureResponse;
  const returnToServiceAfterMs =
    options.returnToServiceAfterMs ||
    RETURN_TO_SERVICE_AFTER_MS;

  const buckets = [[0, 0]];
  let currentState = state.close;
  let nextAttemptMs = Date.now();

  setInterval(() => {
    buckets.push([0, 0]);

    if (buckets.length > totalBuckets) {
      buckets.shift();
    }
  }, windowDurationMs / totalBuckets);

  return async function (...args) {
    if (currentState === state.open) {
      if (nextAttemptMs > Date.now()) {
        return result.fail(exception);
      }

      currentState = state.halfOpen;
    }

    const response = await fn.apply(this, args);

    const lastBucket = buckets[buckets.length - 1];
    const isFailure = _isFailureResponse(response);

    lastBucket[measure.calls] += 1;

    if (isFailure) {
      lastBucket[measure.failure] += 1;
    }

    let bucketsFailures = 0;
    let bucketsCalls = 0;

    buckets.forEach((bucket) => {
      bucketsFailures += bucket[measure.failure];
      bucketsCalls += bucket[measure.calls];
    });

    if (currentState === state.halfOpen) {
      const lastCallFailed =
        isFailure && bucketsCalls > volumeThreshold;

      if (lastCallFailed) {
        currentState = state.open;

        return result.fail(exception);
      }

      currentState = state.close;

      return response;
    }

    const failuresRate =
      (bucketsFailures / bucketsCalls) * 100;

    if (
      failuresRate > failureThresholdRate &&
      bucketsCalls > volumeThreshold
    ) {
      currentState = state.open;
      nextAttemptMs = Date.now() + returnToServiceAfterMs;

      return result.fail(exception);
    }

    return response;
  };
}
