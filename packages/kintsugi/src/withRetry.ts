import { waitFor } from './waitFor';
import { randomBetween } from './randomBetween';
import { Code } from './Code';
import { AsyncFn } from './types';

interface WithRetryOptions {
  firstDelayMs?: number;
  maxDelayMs?: number;
  timeFactor?: number;
  maxRetries?: number;
  retryStrategy?(
    firstDelayMs: number,
    maxDelayMs: number,
    timeFactor: number,
    retryNumber: number,
  ): number;
  shouldRetry?(
    response: any,
    retryNumber: number,
    maxRetries: number,
  ): boolean;
}

const FIRST_DELAY_MS = 200;
const MAX_DELAY_MS = 600;
const TIME_FACTOR = 2;
const MAX_RETRIES = 3;

export function retryStrategy(
  firstDelayMs: number,
  maxDelayMs: number,
  timeFactor: number,
  retryNumber: number,
) {
  const delayMs = Math.min(
    maxDelayMs,
    firstDelayMs * timeFactor ** retryNumber,
  );

  // Full jitter https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
  const delayWithJitterMs = randomBetween(0, delayMs);

  return delayWithJitterMs;
}

export function shouldRetry(
  response: any,
  retryNumber: number,
  maxRetries: number,
) {
  if (response.isFailure) {
    if (response.error.code === Code.CircuitSuspended) {
      return false;
    }

    if (retryNumber < maxRetries) {
      return true;
    }
  }

  return false;
}

export function withRetry(
  fn: AsyncFn,
  options: WithRetryOptions = {},
) {
  const firstDelayMs =
    options.firstDelayMs || FIRST_DELAY_MS;
  const maxDelayMs = options.maxDelayMs || MAX_DELAY_MS;
  const timeFactor = options.timeFactor || TIME_FACTOR;
  const maxRetries = options.maxRetries || MAX_RETRIES;
  const _retryStrategy =
    options.retryStrategy || retryStrategy;
  const _shouldRetry = options.shouldRetry || shouldRetry;

  async function fnWithRetry(
    fn: AsyncFn,
    args: any[],
    retryNumber: number,
  ) {
    const response = await fn.apply(this, args);

    if (_shouldRetry(response, retryNumber, maxRetries)) {
      await waitFor(
        _retryStrategy(
          firstDelayMs,
          maxDelayMs,
          timeFactor,
          retryNumber,
        ),
      );

      return fnWithRetry(fn, args, retryNumber + 1);
    }

    return response;
  }

  return async function (...args) {
    return fnWithRetry(fn, args, 0);
  };
}
