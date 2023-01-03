import {
  Result,
  type AnzenAnyResult,
  type AnzenResultFn,
} from '@daisugi/anzen';
import { setInterval } from 'node:timers';

import { Code } from './code.js';

interface WithCircuitBreakerOpts {
  windowDurationMs?: number;
  totalBuckets?: number;
  failureThresholdRate?: number;
  volumeThreshold?: number;
  returnToServiceAfterMs?: number;
  isFailureResponse?(
    response: AnzenAnyResult<any, any>,
  ): boolean;
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

const exception = { code: Code.CircuitSuspended };

export function isFailureResponse(
  response: AnzenAnyResult<any, any>,
) {
  if (response.isSuccess) {
    return false;
  }
  if (
    response.isFailure &&
    response.getError().code === Code.NotFound
  ) {
    return false;
  }
  return true;
}

export function withCircuitBreaker(
  fn: AnzenResultFn<any, any>,
  opts: WithCircuitBreakerOpts = {},
) {
  const windowDurationMs =
    opts.windowDurationMs || WINDOW_DURATION_MS;
  const totalBuckets = opts.totalBuckets || TOTAL_BUCKETS;
  const failureThresholdRate =
    opts.failureThresholdRate || FAILURE_THRESHOLD_RATE;
  const volumeThreshold =
    opts.volumeThreshold || VOLUME_THRESHOLD;
  const _isFailureResponse =
    opts.isFailureResponse || isFailureResponse;
  const returnToServiceAfterMs =
    opts.returnToServiceAfterMs ||
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
  return async function (this: unknown, ...args: any[]) {
    if (currentState === State.Open) {
      if (nextAttemptMs > Date.now()) {
        return Result.failure(exception);
      }
      currentState = State.HalfOpen;
    }
    const response = await fn.apply(this, args);
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
        return Result.failure(exception);
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
      return Result.failure(exception);
    }
    return response;
  };
}
