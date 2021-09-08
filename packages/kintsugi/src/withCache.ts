import { encToFNV1A } from './encToFNV1A';
import { Code } from './Code';
import { ResultFn, Result } from './result';
import { randomBetween } from './randomBetween';
import { SimpleMemoryStore } from './SimpleMemoryStore';

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
  shouldCache?(response): boolean;
  shouldInvalidateCache?(args: any[]): boolean;
}

const MAX_AGE_MS = 1000 * 60 * 60 * 4; // 4h.
const VERSION = 'v1';

export interface CacheStore {
  get(cacheKey: string): Result | Promise<Result>;
  set(
    cacheKey: string,
    value: any,
    maxAgeMs: number,
  ): Result | Promise<Result>;
}

export function buildCacheKey(
  fnHash: number,
  version: string,
  args: any[],
) {
  return `${fnHash}:${version}:${JSON.stringify(args)}`;
}

export function calculateCacheMaxAgeMs(maxAgeMs: number) {
  return randomBetween(maxAgeMs * 0.75, maxAgeMs);
}

export function shouldInvalidateCache(args: any[]) {
  return false;
}

export function shouldCache(response: Result) {
  if (response.isSuccess) {
    return true;
  }

  // Cache NotFound by default.
  // https://docs.fastly.com/en/guides/http-code-codes-cached-by-default
  if (
    response.isFailure &&
    response.error.code === Code.NotFound
  ) {
    return true;
  }

  return false;
}

export function withCache(
  fn: ResultFn,
  options: Options = {},
) {
  const cacheStore =
    options.cacheStore || new SimpleMemoryStore();
  const version = options.version || VERSION;
  const maxAgeMs = options.maxAgeMs || MAX_AGE_MS;
  const _buildCacheKey =
    options.buildCacheKey || buildCacheKey;
  const _calculateCacheMaxAgeMs =
    options.calculateCacheMaxAgeMs ||
    calculateCacheMaxAgeMs;
  const _shouldCache = options.shouldCache || shouldCache;
  const _shouldInvalidateCache =
    options.shouldInvalidateCache || shouldInvalidateCache;
  const fnHash = encToFNV1A(fn.toString());

  return async function (...args) {
    const cacheKey = _buildCacheKey(fnHash, version, args);

    if (!_shouldInvalidateCache(args)) {
      const cacheResponse = await cacheStore.get(cacheKey);

      if (cacheResponse.isSuccess) {
        return cacheResponse.value;
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
