/*
import assert from "node:assert";
import { describe, it } from "mocha";

import { jest } from "@jest/globals";

import {
  withCache,
  buildCacheKey,
  calculateCacheMaxAgeMs,
  shouldInvalidateCache,
  shouldCache,
} from "../with_cache.js";
import { result, ResultOK } from "../result.js";
import { SimpleMemoryStore } from "../simple_memory_store.js";

describe(
  "withCache",
  () => {
    it(
      "should provide expected methods",
      () => {
        assert.strictEqual(typeof buildCacheKey, "function");
        assert.strictEqual(typeof calculateCacheMaxAgeMs, "function");
        assert.strictEqual(typeof shouldInvalidateCache, "function");
        assert.strictEqual(typeof shouldCache, "function");
      },
    );

    it(
      "should return expected response",
      async () => {
        class Foo {
          count = 0;

          async fn(response: string) {
            this.count = this.count + 1;

            return result.ok(response);
          }
        }

        const foo = new Foo();

        const fnWithCache = withCache(foo.fn.bind(foo));

        const response1 = await fnWithCache("ok");

        assert.strictEqual(foo.count, 1);
        assert.strictEqual(response1.value, "ok");

        const response2 = await fnWithCache("ok");

        assert.strictEqual(foo.count, 1);
        assert.strictEqual(response2.value, "ok");
      },
    );

    describe(
      "when async method is provided",
      () => {
        it(
          "should return expected response",
          async () => {
            let count = 0;

            async function fn() {
              count = count + 1;

              return result.ok("ok");
            }

            const fnWithCache = withCache(fn);

            const response1 = await fnWithCache();

            assert.strictEqual(count, 1);
            assert.strictEqual(response1.value, "ok");

            const response2 = await fnWithCache();

            assert.strictEqual(count, 1);
            assert.strictEqual(response2.value, "ok");
          },
        );
      },
    );

    it(
      "should call cache store with proper parameters",
      async () => {
        const simpleMemoryStore = new SimpleMemoryStore();
        const getMock = jest.spyOn(simpleMemoryStore, "get");
        const setMock = jest.spyOn(simpleMemoryStore, "set");

        function fn(): ResultOK<string> {
          return result.ok("ok");
        }

        const fnWithCache = withCache(fn, { cacheStore: simpleMemoryStore });

        await fnWithCache();

        assert.strictEqual(getMock).toBeCalledWith("3017248029:v1:[]");
        assert.strictEqual(setMock).toBeCalledWith(
          "3017248029:v1:[]",
          { error: null, isFailure: false, isSuccess: true, value: "ok" },
          expect.any(Number),
        );
        // @ts-ignore
        assert.strictEqual(setMock.mock.calls[0][2]).toBeGreaterThanOrEqual(
          10800000,
        );
        // @ts-ignore
        assert.strictEqual(setMock.mock.calls[0][2]).toBeLessThanOrEqual(
          14400000,
        );
      },
    );

    it(
      "should be customized",
      async () => {
        const simpleMemoryStore = new SimpleMemoryStore();
        const getMock = jest.spyOn(simpleMemoryStore, "get");
        const setMock = jest.spyOn(simpleMemoryStore, "set");

        function fn(): ResultOK<string> {
          return result.ok("ok");
        }

        const fnWithCache = withCache(
          fn,
          {
            cacheStore: simpleMemoryStore,
            version: "v2",
            maxAgeMs: 1000,
            buildCacheKey(fnHash, version, args) {
              return `${fnHash}${version}${JSON.stringify(args)}`;
            },
            calculateCacheMaxAgeMs(maxAgeMs) {
              return maxAgeMs;
            },
          },
        );

        await fnWithCache();

        assert.strictEqual(getMock).toBeCalledWith("3017248029v2[]");
        assert.strictEqual(setMock).toBeCalledWith(
          "3017248029v2[]",
          { error: null, isFailure: false, isSuccess: true, value: "ok" },
          1000,
        );
      },
    );

    describe(
      "when `shouldInvalidateCache` returns true",
      () => {
        it(
          "should invalidate cache",
          async () => {
            let count = 0;

            function fn(): ResultOK<string> {
              count = count + 1;

              return result.ok("ok");
            }

            const fnWithCache = withCache(
              fn,
              {
                shouldInvalidateCache(args) {
                  return Boolean(args[0]);
                },
                buildCacheKey(_, __, ___) {
                  return "key";
                },
              },
            );

            const response1 = await fnWithCache(true);

            assert.strictEqual(count, 1);
            assert.strictEqual(response1.value, "ok");

            const response2 = await fnWithCache(true);

            assert.strictEqual(count, 2);
            assert.strictEqual(response2.value, "ok");
          },
        );
      },
    );

    describe(
      "when `shouldCache` is provided",
      () => {
        it(
          "should return expected response",
          async () => {
            let count = 0;

            function fn(): ResultOK<string> {
              count = count + 1;

              return result.ok("ok");
            }

            const fnWithCache = withCache(
              fn,
              {
                shouldCache(response) {
                  return response.value !== "ok";
                },
              },
            );

            const response1 = await fnWithCache(true);

            assert.strictEqual(count, 1);
            assert.strictEqual(response1.value, "ok");

            const response2 = await fnWithCache(true);

            assert.strictEqual(count, 2);
            assert.strictEqual(response2.value, "ok");
          },
        );
      },
    );
  },
);
*/
