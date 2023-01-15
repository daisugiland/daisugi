import { Result, type ResultSuccess } from '@daisugi/anzen';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { between, spy } from 'ts-mockito';

import { SimpleMemoryStore } from '../simple_memory_store.js';
import {
  buildCacheKey,
  calculateCacheMaxAgeMs,
  shouldCache,
  shouldInvalidateCache,
  withCache,
} from '../with_cache.js';

test('withCache', async (t) => {
  await t.test(
    'should provide expected methods',
    async () => {
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
    },
  );

  await t.test(
    'should return expected response',
    async () => {
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
    },
  );

  await t.test(
    'when async method is provided',
    async (t) => {
      await t.test(
        'should return expected response',
        async () => {
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
        },
      );
    },
  );

  await t.test(
    'should call cache store with proper parameters',
    async () => {
      const simpleMemoryStore = new SimpleMemoryStore();
      const simpleMemoryStoreSpy = spy(simpleMemoryStore);
      function fn(): ResultSuccess<string> {
        return Result.success('ok');
      }
      const fnWithCache = withCache(fn, {
        cacheStore: simpleMemoryStore,
      });
      await fnWithCache();
      assert.ok(
        simpleMemoryStoreSpy.get('3017248029:v1:[]'),
      );
      assert.ok(
        simpleMemoryStoreSpy.set(
          '3017248029:v1:[]',
          {
            err: null,
            isFailure: false,
            isSuccess: true,
            value: 'ok',
          },
          // @ts-ignore
          between(10800000, 14400000),
        ),
      );
    },
  );

  await t.test('should be customized', async () => {
    const simpleMemoryStore = new SimpleMemoryStore();
    const simpleMemoryStoreSpy = spy(simpleMemoryStore);
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
    assert.ok(simpleMemoryStoreSpy.get('3017248029v2[]'));
    assert.ok(
      simpleMemoryStoreSpy.set('3017248029v2[]', {
        err: null,
        isFailure: false,
        isSuccess: true,
        value: 'ok',
      }),
    );
  });

  await t.test(
    'when `shouldInvalidateCache` returns true',
    async (t) => {
      await t.test('should invalidate cache', async () => {
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
    },
  );

  await t.test(
    'when `shouldCache` is provided',
    async (t) => {
      await t.test(
        'should return expected response',
        async () => {
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
        },
      );
    },
  );
});
