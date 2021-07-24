import { waitFor } from './waitFor';
import { randomBetween } from './randomBetween';
import { Code } from './Code';
import {
  WithRetryRetryStrategy,
  WithRetryShouldRetry,
  WithRetryOptions,
  AsyncFn,
} from './types';

const STARTING_DELAY_MS = 200;
const MAX_DELAY_MS = 600;
const TIME_FACTOR = 2;
const MAX_RETRIES = 3;

function createRetryStrategy(
  maxDelayMs: number,
  startingDelayMs: number,
  timeFactor: number,
): WithRetryRetryStrategy {
  return function retryStrategy(retryNumber) {
    const delayMs = Math.min(
      maxDelayMs,
      startingDelayMs * timeFactor ** retryNumber,
    );

    // Full jitter https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
    const delayWithJitterMs = randomBetween(0, delayMs);

    return delayWithJitterMs;
  };
}

function createFnWithRetry(
  retryStrategy: WithRetryRetryStrategy,
  shouldRetry: WithRetryShouldRetry,
) {
  async function fnWithRetry(
    fn: AsyncFn,
    args: any[],
    retryNumber: number,
  ) {
    const response = await fn(...args);

    if (shouldRetry(response, retryNumber)) {
      await waitFor(retryStrategy(retryNumber));

      return fnWithRetry(fn, args, retryNumber + 1);
    }

    return response;
  }

  return fnWithRetry;
}

function createShouldAttempt(
  maxRetries: number,
): WithRetryShouldRetry {
  return function shouldRetry(response, retryNumber) {
    if (response.isFailure) {
      if (response.error.code === Code.CircuitSuspended) {
        return false;
      }

      if (retryNumber < maxRetries) {
        return true;
      }
    }

    return false;
  };
}

export function withRetry(
  fn: AsyncFn,
  {
    startingDelayMs = STARTING_DELAY_MS,
    maxDelayMs = MAX_DELAY_MS,
    timeFactor = TIME_FACTOR,
    maxRetries = MAX_RETRIES,
    retryStrategy,
    shouldRetry,
  }: WithRetryOptions = {},
) {
  const customRetryStrategy =
    retryStrategy ||
    createRetryStrategy(
      maxDelayMs,
      startingDelayMs,
      timeFactor,
    );

  const customShouldAttempt =
    shouldRetry || createShouldAttempt(maxRetries);

  const fnWithRetry = createFnWithRetry(
    customRetryStrategy,
    customShouldAttempt,
  );

  return async function (...args) {
    return fnWithRetry(fn, args, 0);
  };
}
