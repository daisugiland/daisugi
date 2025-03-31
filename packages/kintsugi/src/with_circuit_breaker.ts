import { setInterval } from 'node:timers';
import {
  type AnzenAnyResult,
  type AnzenResultFn,
  Result,
} from '@daisugi/anzen';
import { Ayamari } from '@daisugi/ayamari';

const { errFn, errCode } = new Ayamari();

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

const defaultWindowDurationMs = 30000;
const defaultTotalBuckets = 10;
const defaultFailureThresholdRate = 50;
const defaultVolumeThreshold = 10;
const defaultReturnToServiceAfterMs = 5000;

const State = {
  Close: 1,
  Open: 2,
  HalfOpen: 3,
};

const Measure = {
  Failure: 1,
  Calls: 2,
};

const circuitSuspendedErr = Result.failure(
  errFn.CircuitSuspended(
    'Circuit suspended by circuit breaker.',
  ),
);

export function isFailureResponse(
  response: AnzenAnyResult<any, any>,
) {
  if (response.isSuccess) {
    return false;
  }
  if (
    response.isFailure &&
    response.getError().code === errCode.NotFound
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
    opts.windowDurationMs || defaultWindowDurationMs;
  const totalBuckets =
    opts.totalBuckets || defaultTotalBuckets;
  const failureThresholdRate =
    opts.failureThresholdRate ||
    defaultFailureThresholdRate;
  const volumeThreshold =
    opts.volumeThreshold || defaultVolumeThreshold;
  const _isFailureResponse =
    opts.isFailureResponse || isFailureResponse;
  const returnToServiceAfterMs =
    opts.returnToServiceAfterMs ||
    defaultReturnToServiceAfterMs;
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
        return circuitSuspendedErr;
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
    for (const bucket of buckets) {
      bucketsFailures += bucket[Measure.Failure];
      bucketsCalls += bucket[Measure.Calls];
    }
    if (currentState === State.HalfOpen) {
      const lastCallFailed =
        isFailure && bucketsCalls > volumeThreshold;
      if (lastCallFailed) {
        currentState = State.Open;
        return circuitSuspendedErr;
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
      return circuitSuspendedErr;
    }
    return response;
  };
}
