import type {
  AnzenResultFn,
  AnzenResultType,
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
    response: any,
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

export function withRetry(
  fn: AnzenResultFn<any, any>,
  opts: WithRetryOpts = {},
) {
  const firstDelayMs =
    opts.firstDelayMs || defaultFirstDelayMs;
  const maxDelayMs = opts.maxDelayMs || defaultMaxDelayMs;
  const timeFactor = opts.timeFactor || defaultTimeFactor;
  const maxRetries = opts.maxRetries || defaultMaxRetries;
  const _calculateRetryDelayMs =
    opts.calculateRetryDelayMs || calculateRetryDelayMs;
  const _shouldRetry = opts.shouldRetry || shouldRetry;

  async function fnWithRetry(
    this: unknown,
    fn: AnzenResultFn<any, any>,
    args: any[],
    retryNumber: number,
  ): Promise<AnzenResultType<any, any>> {
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

  return (...args: any[]) => fnWithRetry(fn, args, 0);
}
