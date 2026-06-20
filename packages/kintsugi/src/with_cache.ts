import type {
  AnzenAnyResult,
  AnzenResultFn,
} from '@daisugi/anzen';
import { Ayamari } from '@daisugi/ayamari';

import { hashFNV1A } from './hash_fnv1a.js';
import { randomIntBetween } from './random_int_between.js';
import { SimpleMemoryStore } from './simple_memory_store.js';
import { stringifyArgs } from './stringify_args.js';

interface WithCacheOpts {
  version?: string;
  maxAgeMs?: number;
  cacheStore?: CacheStore;
  buildCacheKey?(
    fnHash: number,
    version: string,
    args: any[],
  ): string;
  calculateCacheMaxAgeMs?(maxAgeMs: number): number;
  shouldCache?(response: AnzenAnyResult<any, any>): boolean;
  shouldInvalidateCache?(args: any[]): boolean;
}

const defaultMaxAgeMs = 1000 * 60 * 60 * 4; // 4h.
const defaultVersion = 'v1';

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
  fnHash: number,
  version: string,
  args: any[],
) {
  return `${fnHash}:${version}:${stringifyArgs(args)}`;
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

export function withCache<E, T>(
  fn: AnzenResultFn<E, T>,
  opts: WithCacheOpts = {},
) {
  const cacheStore =
    opts.cacheStore || new SimpleMemoryStore();
  const version = opts.version || defaultVersion;
  const maxAgeMs = opts.maxAgeMs ?? defaultMaxAgeMs;
  const buildCacheKeyFn =
    opts.buildCacheKey || buildCacheKey;
  const calculateCacheMaxAgeMsFn =
    opts.calculateCacheMaxAgeMs || calculateCacheMaxAgeMs;
  const shouldCacheFn = opts.shouldCache || shouldCache;
  const shouldInvalidateCacheFn =
    opts.shouldInvalidateCache || shouldInvalidateCache;
  const fnHash = hashFNV1A(fn.toString());
  return async function (
    this: unknown,
    ...args: any[]
  ): Promise<AnzenAnyResult<E, T>> {
    const cacheKey = buildCacheKeyFn(fnHash, version, args);
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
  };
}
