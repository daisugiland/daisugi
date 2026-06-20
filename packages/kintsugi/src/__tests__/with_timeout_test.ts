import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { AsyncFn } from '../types.js';
import { withTimeout } from '../with_timeout.js';

describe('withTimeout', () => {
  it('should forward arguments and resolve the value', async () => {
    const fnWithTimeout = withTimeout(
      async (a: number) => a * 2,
    );
    assert.strictEqual(await fnWithTimeout(21), 42);
  });

  it('should reject instead of throwing on a synchronous throw', async () => {
    const error = new Error('boom');
    const fn = (() => {
      throw error;
    }) as unknown as AsyncFn;
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
