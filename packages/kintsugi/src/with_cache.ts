import type { AnyResult, ResultFn } from '@daisugi/anzen';

import { encToFNV1A } from './enc_to_fnv1a.js';
import { Code } from './code.js';
import { randomBetween } from './random_between.js';
import { SimpleMemoryStore } from './simple_memory_store.js';
import { stringifyArgs } from './stringify_args.js';

interface Options {
  version?: string;
  maxAgeMs?: number;
  cacheStore?: CacheStore;
  buildCacheKey?(
    fnHash: number,
    version: string,
    args: any[],
  ): string;
  calculateCacheMaxAgeMs?(maxAgeMs: number): number;
  shouldCache?(response: AnyResult<any, any>): boolean;
  shouldInvalidateCache?(args: any[]): boolean;
}

const MAX_AGE_MS = 1000 * 60 * 60 * 4; // 4h.
const VERSION = 'v1';

export interface CacheStore {
  get(cacheKey: string):
    | AnyResult<any, any>
    | Promise<AnyResult<any, any>>;
  set(cacheKey: string, value: any, maxAgeMs: number):
    | AnyResult<any, any>
    | Promise<AnyResult<any, any>>;
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

export function shouldCache(response: AnyResult<any, any>) {
  if (response.isSuccess) {
    return true;
  }
  // Cache NotFound by default.
  // https://docs.fastly.com/en/guides/http-code-codes-cached-by-default
  if (
    response.isFailure && response.getError()
      .code === Code.NotFound
  ) {
    return true;
  }
  return false;
}

export function withCache(
  fn: ResultFn<any, any>,
  options: Options = {},
) {
  const cacheStore =
    options.cacheStore || new SimpleMemoryStore();
  const version = options.version || VERSION;
  const maxAgeMs = options.maxAgeMs || MAX_AGE_MS;
  const _buildCacheKey =
    options.buildCacheKey || buildCacheKey;
  const _calculateCacheMaxAgeMs =
    options.calculateCacheMaxAgeMs || calculateCacheMaxAgeMs;
  const _shouldCache = options.shouldCache || shouldCache;
  const _shouldInvalidateCache =
    options.shouldInvalidateCache || shouldInvalidateCache;
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
