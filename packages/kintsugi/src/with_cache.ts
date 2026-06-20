import type {
  AnzenAnyResult,
  AnzenResultFn,
} from '@daisugi/anzen';
import { Ayamari } from '@daisugi/ayamari';

import { randomIntBetween } from './random_int_between.js';
import { SimpleMemoryStore } from './simple_memory_store.js';
import { stringifyArgs } from './stringify_args.js';
import type { WrappedFn } from './types.js';

interface WithCacheOpts {
  version?: string;
  maxAgeMs?: number;
  cacheStore?: CacheStore;
  buildCacheKey?(
    fnId: number,
    version: string,
    args: any[],
  ): string;
  calculateCacheMaxAgeMs?(maxAgeMs: number): number;
  shouldCache?(response: AnzenAnyResult<any, any>): boolean;
  shouldInvalidateCache?(args: any[]): boolean;
}

const defaultMaxAgeMs = 1000 * 60 * 60 * 4; // 4h.
const defaultVersion = 'v1';

// Per-wrap identity, assigned in call order. Unlike hashing `fn.toString()`,
// distinct closures from the same factory get distinct ids (no collision on a
// shared cacheStore) and minification/comment changes don't shift keys. It is
// stable across processes that wrap in the same order; for non-deterministic
// wrapping with a persistent shared store, pass an explicit `version`.
let nextFnId = 0;

export interface CacheStore {
  get(
    cacheKey: string,
  ):
    | AnzenAnyResult<any, any>
    | Promise<AnzenAnyResult<any, any>>;
  set(
    cacheKey: string,
    value: any,
    maxAgeMs?: number,
  ):
    | AnzenAnyResult<any, any>
    | Promise<AnzenAnyResult<any, any>>;
  delete(
    cacheKey: string,
  ):
    | AnzenAnyResult<any, any>
    | Promise<AnzenAnyResult<any, any>>;
}

export function buildCacheKey(
  fnId: number,
  version: string,
  args: any[],
) {
  return `${fnId}:${version}:${stringifyArgs(args)}`;
}

export function calculateCacheMaxAgeMs(maxAgeMs: number) {
  return randomIntBetween(maxAgeMs * 0.75, maxAgeMs);
}

export function shouldInvalidateCache() {
  return false;
}

export function shouldCache(
  response: AnzenAnyResult<any, any>,
) {
  if (response.isSuccess) {
    return true;
  }
  // Cache NotFound by default.
  // https://docs.fastly.com/en/guides/http-code-codes-cached-by-default
  if (
    response.isFailure &&
    response.getError().code === Ayamari.errCode.NotFound
  ) {
    return true;
  }
  return false;
}

export function withCache<
  Fn extends AnzenResultFn<unknown, unknown>,
>(fn: Fn, opts: WithCacheOpts = {}): WrappedFn<Fn> {
  const cacheStore =
    opts.cacheStore ?? new SimpleMemoryStore();
  const version = opts.version ?? defaultVersion;
  const maxAgeMs = opts.maxAgeMs ?? defaultMaxAgeMs;
  const buildCacheKeyFn =
    opts.buildCacheKey ?? buildCacheKey;
  const calculateCacheMaxAgeMsFn =
    opts.calculateCacheMaxAgeMs ?? calculateCacheMaxAgeMs;
  const shouldCacheFn = opts.shouldCache ?? shouldCache;
  const shouldInvalidateCacheFn =
    opts.shouldInvalidateCache ?? shouldInvalidateCache;
  const fnId = nextFnId++;
  return async function (this: unknown, ...args: any[]) {
    const cacheKey = buildCacheKeyFn(fnId, version, args);
    if (shouldInvalidateCacheFn(args)) {
      // Evict the stale entry before refreshing, so invalidation removes
      // it even when the refreshed response is not cacheable. Awaited so
      // it completes before the re-set below, and best-effort like `set`.
      try {
        await Promise.resolve(cacheStore.delete(cacheKey));
      } catch {
        // Silent fail.
      }
    } else {
      const cacheResponse = await cacheStore.get(cacheKey);
      if (cacheResponse.isSuccess) {
        return cacheResponse.getValue();
      }
    }
    const response = await fn.apply(this, args);
    if (shouldCacheFn(response)) {
      // Caching is best-effort and fire-and-forget: `set` may return a
      // Result synchronously or a Promise, so normalize with
      // `Promise.resolve` and swallow any rejection without awaiting.
      try {
        Promise.resolve(
          cacheStore.set(
            cacheKey,
            response,
            calculateCacheMaxAgeMsFn(maxAgeMs),
          ),
        ).catch(() => {}); // Silent fail.
      } catch {
        // Silent fail.
      }
    }
    return response;
  } as WrappedFn<Fn>;
}
