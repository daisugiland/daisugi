import { Result, result, ResultFn } from './result';
import { Code } from './Code';
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

enum State {
  Close,
  Open,
  HalfOpen,
}

enum Measure {
  Failure,
  Calls,
}

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
  fn: ResultFn,
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
  let currentState = State.Close;
  let nextAttemptMs = Date.now();

  setInterval(() => {
    buckets.push([0, 0]);

    if (buckets.length > totalBuckets) {
      buckets.shift();
    }
  }, windowDurationMs / totalBuckets);

  return async function (...args: any[]) {
    if (currentState === State.Open) {
      if (nextAttemptMs > Date.now()) {
        return result.fail(exception);
      }

      currentState = State.HalfOpen;
    }

    const response = await fn(args);

    const lastBucket = buckets[buckets.length - 1];
    const isFailure = _isFailureResponse(response);

    lastBucket[Measure.Calls] += 1;

    if (isFailure) {
      lastBucket[Measure.Failure] += 1;
    }

    let bucketsFailures = 0;
    let bucketsCalls = 0;

    buckets.forEach((bucket) => {
      bucketsFailures += bucket[Measure.Failure];
      bucketsCalls += bucket[Measure.Calls];
    });

    if (currentState === State.HalfOpen) {
      const lastCallFailed =
        isFailure && bucketsCalls > volumeThreshold;

      if (lastCallFailed) {
        currentState = State.Open;

        return result.fail(exception);
      }

      currentState = State.Close;

      return response;
    }

    const failuresRate =
      (bucketsFailures / bucketsCalls) * 100;

    if (
      failuresRate > failureThresholdRate &&
      bucketsCalls > volumeThreshold
    ) {
      currentState = State.Open;
      nextAttemptMs = Date.now() + returnToServiceAfterMs;

      return result.fail(exception);
    }

    return response;
  };
}
