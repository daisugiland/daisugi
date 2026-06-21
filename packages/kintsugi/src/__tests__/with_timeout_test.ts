import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  type AnzenResultFn,
  success,
} from '@daisugi/anzen';

import { withTimeout } from '../with_timeout.js';

describe('withTimeout', () => {
  it('should forward arguments and resolve the value', async () => {
    const fnWithTimeout = withTimeout(async (a: number) =>
      success(a * 2),
    );

    const response = await fnWithTimeout(21);

    assert.strictEqual(
      response.isSuccess && response.unwrap(),
      42,
    );
  });

  it('should reject instead of throwing on a synchronous throw', async () => {
    const error = new Error('boom');
    const fn = (() => {
      throw error;
    }) as unknown as AnzenResultFn<unknown, unknown>;
    const fnWithTimeout = withTimeout(fn, {
      maxTimeMs: 50,
    });

    // Must return a promise, not throw synchronously.
    const promise = fnWithTimeout();
    assert.ok(promise instanceof Promise);
    await assert.rejects(
      promise,
      (thrown) => thrown === error,
    );
  });
});
