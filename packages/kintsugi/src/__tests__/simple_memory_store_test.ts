import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SimpleMemoryStore } from '../simple_memory_store.js';
import { waitFor } from '../wait_for.js';

describe('SimpleMemoryStore', () => {
  it('should store and retrieve a value', () => {
    const store = new SimpleMemoryStore();
    store.set('k', 'v');
    const response = store.get('k');
    assert.strictEqual(response.isSuccess, true);
    assert.strictEqual(response.unwrap(), 'v');
  });

  it('should return a failure for a missing key', () => {
    const store = new SimpleMemoryStore();
    const response = store.get('missing');
    assert.strictEqual(response.isFailure, true);
  });

  it('should expire an entry after maxAgeMs', async () => {
    const store = new SimpleMemoryStore();
    store.set('k', 'v', 5);
    assert.strictEqual(store.get('k').isSuccess, true);
    await waitFor(15);
    assert.strictEqual(store.get('k').isFailure, true);
  });

  it('should not expire when no maxAgeMs is given', async () => {
    const store = new SimpleMemoryStore();
    store.set('k', 'v');
    await waitFor(10);
    assert.strictEqual(store.get('k').isSuccess, true);
  });

  it('should remove the key on delete', () => {
    const store = new SimpleMemoryStore();
    store.set('k', 'v');
    store.delete('k');
    assert.strictEqual(store.get('k').isFailure, true);
  });

  it('should ack set and delete with the cache key', () => {
    const store = new SimpleMemoryStore();
    assert.strictEqual(store.set('k', 'v').unwrap(), 'k');
    assert.strictEqual(store.delete('k').unwrap(), 'k');
  });

  it('should evict the least-recently-used entry over maxSize', () => {
    const store = new SimpleMemoryStore({ maxSize: 2 });
    store.set('a', 1);
    store.set('b', 2);
    store.get('a'); // 'a' becomes most-recently-used.
    store.set('c', 3); // Over cap -> evict 'b'.
    assert.strictEqual(store.get('a').isSuccess, true);
    assert.strictEqual(store.get('b').isFailure, true);
    assert.strictEqual(store.get('c').isSuccess, true);
  });
});
