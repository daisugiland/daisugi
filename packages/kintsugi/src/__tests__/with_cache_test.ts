import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Result, type ResultSuccess } from '@daisugi/anzen';

import { SimpleMemoryStore } from '../simple_memory_store.js';
import {
  buildCacheKey,
  type CacheStore,
  calculateCacheMaxAgeMs,
  shouldCache,
  shouldInvalidateCache,
  withCache,
} from '../with_cache.js';

describe('withCache', () => {
  it('should provide expected methods', () => {
    assert.strictEqual(typeof buildCacheKey, 'function');
    assert.strictEqual(
      typeof calculateCacheMaxAgeMs,
      'function',
    );
    assert.strictEqual(
      typeof shouldInvalidateCache,
      'function',
    );
    assert.strictEqual(typeof shouldCache, 'function');
  });

  it('should return expected response', async () => {
    class Foo {
      count = 0;
      async fn(response: string) {
        this.count = this.count + 1;

        return Result.success(response);
      }
    }
    const foo = new Foo();
    const fnWithCache = withCache(foo.fn.bind(foo));
    const response1 = await fnWithCache('ok');
    assert.strictEqual(foo.count, 1);
    assert.strictEqual(response1.getValue(), 'ok');
    const response2 = await fnWithCache('ok');
    assert.strictEqual(foo.count, 1);
    assert.strictEqual(response2.getValue(), 'ok');
  });

  describe('when async method is provided', () => {
    it('should return expected response', async () => {
      let count = 0;
      async function fn() {
        count = count + 1;
        return Result.success('ok');
      }
      const fnWithCache = withCache(fn);
      const response1 = await fnWithCache();
      assert.strictEqual(count, 1);
      assert.strictEqual(response1.getValue(), 'ok');
      const response2 = await fnWithCache();
      assert.strictEqual(count, 1);
      assert.strictEqual(response2.getValue(), 'ok');
    });
  });

  it('should call cache store with proper parameters', async (t) => {
    const simpleMemoryStore = new SimpleMemoryStore();
    const getMock = t.mock.method(simpleMemoryStore, 'get');
    const setMock = t.mock.method(simpleMemoryStore, 'set');
    function fn(): ResultSuccess<string> {
      return Result.success('ok');
    }
    const fnWithCache = withCache(fn, {
      cacheStore: simpleMemoryStore,
    });
    await fnWithCache();
    assert.strictEqual(getMock.mock.calls.length, 1);
    const cacheKey = getMock.mock.calls[0]?.arguments[0];
    assert.match(String(cacheKey), /^\d+:v1:\[\]$/u);
    const setArgs = setMock.mock.calls[0]?.arguments;
    assert.strictEqual(setArgs?.[0], cacheKey);
    const cached = setArgs?.[1] as ResultSuccess<string>;
    assert.strictEqual(cached?.isSuccess, true);
    assert.strictEqual(cached?.getValue(), 'ok');
    const maxAgeMs = setArgs?.[2];
    assert.ok(
      typeof maxAgeMs === 'number' &&
        maxAgeMs >= 10800000 &&
        maxAgeMs <= 14400000,
    );
  });

  it('should be customized', async (t) => {
    const simpleMemoryStore = new SimpleMemoryStore();
    const getMock = t.mock.method(simpleMemoryStore, 'get');
    const setMock = t.mock.method(simpleMemoryStore, 'set');
    function fn(): ResultSuccess<string> {
      return Result.success('ok');
    }
    const fnWithCache = withCache(fn, {
      cacheStore: simpleMemoryStore,
      version: 'v2',
      maxAgeMs: 1000,
      buildCacheKey(fnHash, version, args) {
        return `${fnHash}${version}${JSON.stringify(args)}`;
      },
      calculateCacheMaxAgeMs(maxAgeMs) {
        return maxAgeMs;
      },
    });
    await fnWithCache();
    assert.strictEqual(getMock.mock.calls.length, 1);
    const cacheKey = getMock.mock.calls[0]?.arguments[0];
    assert.match(String(cacheKey), /^\d+v2\[\]$/u);
    const setArgs = setMock.mock.calls[0]?.arguments;
    assert.strictEqual(setArgs?.[0], cacheKey);
    const cached = setArgs?.[1] as ResultSuccess<string>;
    assert.strictEqual(cached?.isSuccess, true);
    assert.strictEqual(cached?.getValue(), 'ok');
    assert.strictEqual(setArgs?.[2], 1000);
  });

  describe('when `shouldInvalidateCache` returns true', () => {
    it('should invalidate cache', async () => {
      let count = 0;
      function fn(): ResultSuccess<string> {
        count = count + 1;
        return Result.success('ok');
      }
      const fnWithCache = withCache(fn, {
        shouldInvalidateCache(args) {
          return Boolean(args[0]);
        },
        buildCacheKey(_, __, ___) {
          return 'key';
        },
      });

      const response1 = await fnWithCache(true);
      assert.strictEqual(count, 1);
      assert.strictEqual(response1.getValue(), 'ok');
      const response2 = await fnWithCache(true);
      assert.strictEqual(count, 2);
      assert.strictEqual(response2.getValue(), 'ok');
    });

    it('should evict the entry via the store delete', async () => {
      const deleted: string[] = [];
      const cacheStore: CacheStore = {
        get: () => Result.failure('miss'),
        set: (_cacheKey, value) => Result.success(value),
        delete(cacheKey) {
          deleted.push(cacheKey);
          return Result.success(cacheKey);
        },
      };
      const fnWithCache = withCache(
        (): ResultSuccess<string> => Result.success('ok'),
        {
          cacheStore,
          shouldInvalidateCache: () => true,
          buildCacheKey: () => 'key',
        },
      );

      await fnWithCache(true);
      assert.deepStrictEqual(deleted, ['key']);
    });
  });

  describe('when `shouldCache` is provided', () => {
    it('should return expected response', async () => {
      let count = 0;
      function fn(): ResultSuccess<string> {
        count = count + 1;
        return Result.success('ok');
      }
      const fnWithCache = withCache(fn, {
        shouldCache(response) {
          return response.getValue() !== 'ok';
        },
      });
      const response1 = await fnWithCache(true);
      assert.strictEqual(count, 1);
      assert.strictEqual(response1.getValue(), 'ok');
      const response2 = await fnWithCache(true);
      assert.strictEqual(count, 2);
      assert.strictEqual(response2.getValue(), 'ok');
    });
  });
});
