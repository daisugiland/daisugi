import {
  type AnzenAnyResult,
  type AnzenResultFn,
  failure,
} from '@daisugi/anzen';
import { type AyamariErr, errCode } from '@daisugi/ayamari';

import { randomIntBetween } from './random_int_between.js';
import type { WrappedFn } from './types.js';
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
  const delayWithJitterMs = randomIntBetween(0, delayMs);

  return delayWithJitterMs;
}

/**
 * Error codes that will never succeed on retry, so retrying is skipped.
 * Kept consistent with how `withCache` treats `NotFound`.
 */
const nonRetryableErrCodes = new Set<string>([
  errCode.NotFound,
]);

export function shouldRetry(
  response: AnzenAnyResult<unknown, unknown>,
  retryNumber: number,
  maxRetries: number,
) {
  if (response.isFailure) {
    const { code } = response.unwrapErr() as AyamariErr;
    if (nonRetryableErrCodes.has(code)) {
      return false;
    }
    if (retryNumber < maxRetries) {
      return true;
    }
  }
  return false;
}

export function withRetry<
  Fn extends AnzenResultFn<unknown, unknown>,
>(fn: Fn, opts: WithRetryOpts = {}): WrappedFn<Fn> {
  const firstDelayMs =
    opts.firstDelayMs ?? defaultFirstDelayMs;
  const maxDelayMs = opts.maxDelayMs ?? defaultMaxDelayMs;
  const timeFactor = opts.timeFactor ?? defaultTimeFactor;
  const maxRetries = opts.maxRetries ?? defaultMaxRetries;
  const calculateRetryDelayMsFn =
    opts.calculateRetryDelayMs ?? calculateRetryDelayMs;
  const shouldRetryFn = opts.shouldRetry ?? shouldRetry;

  async function fnWithRetry(
    this: unknown,
    retryFn: AnzenResultFn<unknown, unknown>,
    args: any[],
    retryNumber: number,
  ): Promise<AnzenAnyResult<unknown, unknown>> {
    let response: AnzenAnyResult<unknown, unknown>;
    let rejection: unknown;
    let rejected = false;
    try {
      response = await retryFn.apply(this, args);
    } catch (error) {
      // Treat a rejection like a Result failure for the retry decision, so
      // both error channels retry the same way (and nonRetryableErrCodes
      // still applies to a thrown AyamariErr).
      rejected = true;
      rejection = error;
      response = failure(error);
    }
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
    // Exhausted or non-retryable: preserve the original error channel by
    // re-throwing the caught value as-is.
    if (rejected) {
      // oxlint-disable-next-line no-throw-literal
      throw rejection;
    }
    return response;
  }

  return function (this: unknown, ...args: any[]) {
    return fnWithRetry.call(this, fn, args, 0);
  } as WrappedFn<Fn>;
}
