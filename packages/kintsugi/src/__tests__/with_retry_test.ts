import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  type AnzenResultFn,
  err,
  ok,
} from '@daisugi/anzen';
import { Ayamari } from '@daisugi/ayamari';

import { withRetry } from '../with_retry.js';

const { errFn } = new Ayamari();

describe('withRetry', () => {
  it('should return expected response', async () => {
    async function fn() {
      return ok('ok');
    }

    const fnWithRetry = withRetry(fn);

    const response = await fnWithRetry();

    assert.strictEqual(response.unwrap(), 'ok');
  });

  it('should forward arguments to the wrapped function', async () => {
    async function fn(a: number, b: number) {
      return ok(a + b);
    }

    const fnWithRetry = withRetry(fn);

    const response = await fnWithRetry(2, 3);

    assert.strictEqual(response.unwrap(), 5);
  });

  it('should preserve `this` context', async () => {
    class Foo {
      value = 7;
      async fn() {
        return ok(this.value);
      }
    }
    const foo = new Foo();

    const fnWithRetry = withRetry(foo.fn);

    const response = await fnWithRetry.call(foo);

    assert.strictEqual(response.unwrap(), 7);
  });

  it('should retry on failure and forward arguments on each retry', async () => {
    let count = 0;
    async function fn(a: number) {
      count = count + 1;
      if (count < 3) {
        return err(errFn.Fail('fail'));
      }
      return ok(a);
    }

    const fnWithRetry = withRetry(fn, { firstDelayMs: 1 });

    const response = await fnWithRetry(42);

    assert.strictEqual(count, 3);
    assert.strictEqual(response.unwrap(), 42);
  });

  it('should honor `maxRetries: 0` (no retries)', async () => {
    let count = 0;
    async function fn() {
      count = count + 1;
      return err(errFn.Fail('fail'));
    }

    const fnWithRetry = withRetry(fn, { maxRetries: 0 });

    await fnWithRetry();

    assert.strictEqual(count, 1);
  });

  it('should not retry a NotFound failure', async () => {
    let count = 0;
    async function fn() {
      count = count + 1;
      return err(errFn.NotFound('missing'));
    }

    const fnWithRetry = withRetry(fn, { firstDelayMs: 1 });

    await fnWithRetry();

    assert.strictEqual(count, 1);
  });

  it('should retry a rejecting function and forward arguments', async () => {
    let count = 0;
    async function fn(a: number) {
      count = count + 1;
      if (count < 3) {
        throw errFn.Fail('boom');
      }
      return ok(a);
    }

    const fnWithRetry = withRetry(fn, { firstDelayMs: 1 });

    const response = await fnWithRetry(42);

    assert.strictEqual(count, 3);
    assert.strictEqual(response.unwrap(), 42);
  });

  it('should re-throw the original error when retries are exhausted', async () => {
    let count = 0;
    const error = errFn.Fail('always');
    const fn: AnzenResultFn<
      unknown,
      unknown
    > = async () => {
      count = count + 1;
      throw error;
    };

    const fnWithRetry = withRetry(fn, { firstDelayMs: 1 });

    await assert.rejects(
      fnWithRetry(),
      (thrown) => thrown === error,
    );
    assert.ok(count > 1);
  });

  it('should not retry a thrown NotFound error', async () => {
    let count = 0;
    const fn: AnzenResultFn<
      unknown,
      unknown
    > = async () => {
      count = count + 1;
      throw errFn.NotFound('missing');
    };

    const fnWithRetry = withRetry(fn, { firstDelayMs: 1 });

    await assert.rejects(fnWithRetry());
    assert.strictEqual(count, 1);
  });
});
