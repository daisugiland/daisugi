import type {
  AnzenResult,
  AnzenResultFn,
} from '@daisugi/anzen';
import { errCode } from '@daisugi/ayamari';

import { randomIntBetween } from './random_int_between.js';
import { SimpleMemoryStore } from './simple_memory_store.js';
import { stringifyArgs } from './stringify_args.js';
import type { WrappedFn } from './types.js';

export interface WithCacheOpts {
  version?: string;
  maxAgeMs?: number;
  cacheStore?: CacheStore;
  buildCacheKey?(
    fnId: number,
    version: string,
    args: any[],
  ): string;
  calculateCacheMaxAgeMs?(maxAgeMs: number): number;
  shouldCache?(response: AnzenResult<any, any>): boolean;
  shouldInvalidateCache?(args: any[]): boolean;
}

const defaultMaxAgeMs = 1000 * 60 * 60 * 4; // 4h.
const defaultVersion = 'v1';

// The `CacheStore` contract allows sync (e.g. `SimpleMemoryStore`) or async
// returns. Awaiting a non-thenable still schedules a microtask, so only await
// when the return is actually a promise; sync stores then avoid that hop.
function isThenable(
  value: unknown,
): value is Promise<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

// Per-wrap identity, assigned in call order. Unlike hashing `fn.toString()`,
// distinct closures get distinct ids (no shared-store collision) and minification
// doesn't shift keys. For non-deterministic wrap order + shared store, pass `version`.
let nextFnId = 0;

export interface CacheStore {
  get(
    cacheKey: string,
  ): AnzenResult<any, any> | Promise<AnzenResult<any, any>>;
  set(
    cacheKey: string,
    value: any,
    maxAgeMs?: number,
  ): AnzenResult<any, any> | Promise<AnzenResult<any, any>>;
  delete(
    cacheKey: string,
  ): AnzenResult<any, any> | Promise<AnzenResult<any, any>>;
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
  response: AnzenResult<any, any>,
) {
  if (response.isOk) {
    return true;
  }
  // Cache NotFound by default.
  // https://docs.fastly.com/en/guides/http-code-codes-cached-by-default
  if (
    response.isErr &&
    response.unwrapErr().code === errCode.NotFound
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
        const deleted = cacheStore.delete(cacheKey);
        if (isThenable(deleted)) {
          await deleted;
        }
      } catch {
        // Silent fail.
      }
    } else {
      const got = cacheStore.get(cacheKey);
      const cacheResponse = isThenable(got)
        ? await got
        : got;
      if (cacheResponse.isOk) {
        return cacheResponse.unwrap();
      }
    }
    const response = await fn.apply(this, args);
    if (shouldCacheFn(response)) {
      // Caching is best-effort and fire-and-forget: `set` may return a
      // Result synchronously or a Promise. Only attach a rejection handler
      // when it is actually a promise; a synchronous store needs no wrapper.
      try {
        const stored = cacheStore.set(
          cacheKey,
          response,
          calculateCacheMaxAgeMsFn(maxAgeMs),
        );
        if (isThenable(stored)) {
          stored.catch(() => {}); // Silent fail.
        }
      } catch {
        // Silent fail.
      }
    }
    return response;
  } as WrappedFn<Fn>;
}
