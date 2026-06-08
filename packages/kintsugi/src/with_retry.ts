import type {
  AnzenAnyResult,
  AnzenResultFn,
} from '@daisugi/anzen';
import { Ayamari } from '@daisugi/ayamari';

import { randomBetween } from './random_between.js';
import { waitFor } from './wait_for.js';

interface WithRetryOpts {
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
    response: AnzenAnyResult<unknown, unknown>,
    retryNumber: number,
    maxRetries: number,
  ): boolean;
}

const defaultFirstDelayMs = 200;
const defaultMaxDelayMs = 600;
const defaultTimeFactor = 2;
const defaultMaxRetries = 3;

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
      response.getError().code ===
      Ayamari.errCode.CircuitSuspended
    ) {
      return false;
    }
    if (retryNumber < maxRetries) {
      return true;
    }
  }
  return false;
}

export function withRetry<E, T>(
  fn: AnzenResultFn<E, T>,
  opts: WithRetryOpts = {},
) {
  const firstDelayMs =
    opts.firstDelayMs || defaultFirstDelayMs;
  const maxDelayMs = opts.maxDelayMs || defaultMaxDelayMs;
  const timeFactor = opts.timeFactor || defaultTimeFactor;
  const maxRetries = opts.maxRetries || defaultMaxRetries;
  const calculateRetryDelayMsFn =
    opts.calculateRetryDelayMs || calculateRetryDelayMs;
  const shouldRetryFn = opts.shouldRetry || shouldRetry;

  async function fnWithRetry(
    this: unknown,
    retryFn: AnzenResultFn<E, T>,
    args: any[],
    retryNumber: number,
  ): Promise<AnzenAnyResult<E, T>> {
    const response = await retryFn.apply(this, args);
    if (shouldRetryFn(response, retryNumber, maxRetries)) {
      await waitFor(
        calculateRetryDelayMsFn(
          firstDelayMs,
          maxDelayMs,
          timeFactor,
          retryNumber,
        ),
      );
      return fnWithRetry.call(
        this,
        retryFn,
        args,
        retryNumber + 1,
      );
    }
    return response;
  }

  return function (
    this: unknown,
    ...args: any[]
  ): Promise<AnzenAnyResult<E, T>> {
    return fnWithRetry.call(this, fn, args, 0);
  };
}
