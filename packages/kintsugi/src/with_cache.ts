import type {
  AnzenResultFn,
  AnzenResultType,
} from '@daisugi/anzen';
import { Ayamari } from '@daisugi/ayamari';

import { encToFNV1A } from './enc_to_fnv1a.js';
import { randomBetween } from './random_between.js';
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
  shouldCache?(
    response: AnzenResultType<any, any>,
  ): boolean;
  shouldInvalidateCache?(args: any[]): boolean;
}

const defaultMaxAgeMs = 1000 * 60 * 60 * 4; // 4h.
const defaultVersion = 'v1';

export interface CacheStore {
  get(
    cacheKey: string,
  ):
    | AnzenResultType<any, any>
    | Promise<AnzenResultType<any, any>>;
  set(
    cacheKey: string,
    value: any,
    maxAgeMs: number,
  ):
    | AnzenResultType<any, any>
    | Promise<AnzenResultType<any, any>>;
}

export function buildCacheKey(
  fnHash: number,
  version: string,
  args: any[],
) {
  return `${fnHash}:${version}:${stringifyArgs(args)}`;
}

export function calculateCacheMaxAgeMs(maxAgeMs: number) {
  return randomBetween(maxAgeMs * 0.75, maxAgeMs);
}

export function shouldInvalidateCache() {
  return false;
}

export function shouldCache(
  response: AnzenResultType<any, any>,
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

export function withCache(
  fn: AnzenResultFn<any, any>,
  opts: WithCacheOpts = {},
) {
  const cacheStore =
    opts.cacheStore || new SimpleMemoryStore();
  const version = opts.version || defaultVersion;
  const maxAgeMs = opts.maxAgeMs || defaultMaxAgeMs;
  const _buildCacheKey =
    opts.buildCacheKey || buildCacheKey;
  const _calculateCacheMaxAgeMs =
    opts.calculateCacheMaxAgeMs || calculateCacheMaxAgeMs;
  const _shouldCache = opts.shouldCache || shouldCache;
  const _shouldInvalidateCache =
    opts.shouldInvalidateCache || shouldInvalidateCache;
  const fnHash = encToFNV1A(fn.toString());
  return async function (this: unknown, ...args: any[]) {
    const cacheKey = _buildCacheKey(fnHash, version, args);
    if (!_shouldInvalidateCache(args)) {
      const cacheResponse = await cacheStore.get(cacheKey);
      if (cacheResponse.isSuccess) {
        return cacheResponse.getValue();
      }
    }
    const response = await fn.apply(this, args);
    if (_shouldCache(response)) {
      cacheStore.set(
        cacheKey,
        response,
        _calculateCacheMaxAgeMs(maxAgeMs),
      ); // Silent fail.
    }
    return response;
  };
}
