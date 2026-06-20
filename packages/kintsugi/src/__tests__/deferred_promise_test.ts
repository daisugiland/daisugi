import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { deferredPromise } from '../deferred_promise.js';

describe('deferredPromise', () => {
  it('should start pending', () => {
    const deferred = deferredPromise();
    assert.strictEqual(deferred.isPending(), true);
    assert.strictEqual(deferred.isFulfilled(), false);
    assert.strictEqual(deferred.isRejected(), false);
  });

  it('should flip flags synchronously on resolve', async () => {
    const deferred = deferredPromise<string>();
    deferred.resolve('ok');
    assert.strictEqual(deferred.isPending(), false);
    assert.strictEqual(deferred.isFulfilled(), true);
    assert.strictEqual(deferred.isRejected(), false);
    assert.strictEqual(await deferred.promise, 'ok');
  });

  it('should flip flags synchronously on reject', async () => {
    const deferred = deferredPromise();
    deferred.promise.catch(() => {});
    deferred.reject(new Error('nope'));
    assert.strictEqual(deferred.isPending(), false);
    assert.strictEqual(deferred.isFulfilled(), false);
    assert.strictEqual(deferred.isRejected(), true);
  });

  it('should ignore settling after the first settle', () => {
    const deferred = deferredPromise();
    deferred.promise.catch(() => {});
    deferred.resolve(1);
    deferred.reject(new Error('late'));
    assert.strictEqual(deferred.isFulfilled(), true);
    assert.strictEqual(deferred.isRejected(), false);
  });
});
