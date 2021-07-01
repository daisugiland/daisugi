import { waitFor } from './waitFor';
import { randomBetween } from './randomBetween';
import {
  WithRetryRetryStrategy,
  WithRetryShouldRetry,
  WithRetryOptions,
} from './types';

const STARTING_DELAY_MS = 100;
const MAX_DELAY_MS = 300;
const TIME_FACTOR = 2;
const MAX_RETRIES = 5;

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
  async function fnWithRetry(fn, args, retryNumber) {
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
    return response.isFailure && retryNumber < maxRetries;
  };
}

export function withRetry(
  fn: (...any) => any,
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

  return function (...args) {
    return fnWithRetry(fn, args, 0);
  };
}
