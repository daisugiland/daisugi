import type { AnyResult, ResultFn } from '@daisugi/anzen';

import { Code } from './code.js';
import { randomBetween } from './random_between.js';
import { waitFor } from './wait_for.js';

interface Options {
  firstDelayMs?: number;
  maxDelayMs?: number;
  timeFactor?: number;
  maxRetries?: number;
  calculateRetryDelayMs?(
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

export function calculateRetryDelayMs(
  firstDelayMs: number,
  maxDelayMs: number,
  timeFactor: number,
  retryNumber: number,
) {
  const delayMs = Math.min(
    maxDelayMs,
    firstDelayMs * timeFactor ** retryNumber,
  );
  /** Full jitter https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/ */
  const delayWithJitterMs = randomBetween(0, delayMs);

  return delayWithJitterMs;
}

export function shouldRetry(
  response: any,
  retryNumber: number,
  maxRetries: number,
) {
  if (response.isFailure) {
    if (
      response.getError().code === Code.CircuitSuspended
    ) {
      return false;
    }
    if (retryNumber < maxRetries) {
      return true;
    }
  }
  return false;
}

export function withRetry(
  fn: ResultFn<any, any>,
  options: Options = {},
) {
  const firstDelayMs =
    options.firstDelayMs || FIRST_DELAY_MS;
  const maxDelayMs = options.maxDelayMs || MAX_DELAY_MS;
  const timeFactor = options.timeFactor || TIME_FACTOR;
  const maxRetries = options.maxRetries || MAX_RETRIES;
  const _calculateRetryDelayMs =
    options.calculateRetryDelayMs || calculateRetryDelayMs;
  const _shouldRetry = options.shouldRetry || shouldRetry;

  async function fnWithRetry(
    this: unknown,
    fn: ResultFn<any, any>,
    args: any[],
    retryNumber: number,
  ): Promise<AnyResult<any, any>> {
    const response = await fn.call(this, args);
    if (_shouldRetry(response, retryNumber, maxRetries)) {
      await waitFor(
        _calculateRetryDelayMs(
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

  return function (...args: any[]) {
    return fnWithRetry(fn, args, 0);
  };
}
