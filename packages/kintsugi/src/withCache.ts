import { encToFNV1A } from './encToFNV1A';
import { Code } from './Code';
import { ResultAsyncFn, Result } from './types';
import { randomBetween } from './randomBetween';

interface WithCacheOptions {
  version?: string;
  maxAgeMs?: number;
  generateCacheKey?(
    fnHash: number,
    version: string,
    args: any[],
  ): string;
  generateCacheMaxAge?(maxAgeMs: number): number;
  shouldCache?(response): boolean;
  shouldInvalidateCache?(args: any[]): boolean;
}

const MAX_AGE_MS = 1000 * 60 * 60 * 4; // 4h.
const VERSION = 'v1';

export interface CacheStore {
  get(cacheKey: string): Result<any, any>;
  set(
    cacheKey: string,
    value: any,
    maxAgeMs: number,
  ): Result<any, any>;
}

export function generateCacheKey(
  fnHash: number,
  version: string,
  args: any[],
) {
  return `${fnHash}:${version}:${JSON.stringify(args)}`;
}

export function generateCacheMaxAge(maxAgeMs: number) {
  return randomBetween(maxAgeMs * 0.75, maxAgeMs);
}

function shouldInvalidateCache(args: any[]) {
  return false;
}

export function shouldCache(response) {
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

export function createWithCache(
  cacheStore: CacheStore,
  options: WithCacheOptions = {},
) {
  return function withCache(
    asyncFn: ResultAsyncFn,
    _options: WithCacheOptions = {},
  ) {
    const version =
      _options.version || options.version || VERSION;
    const maxAgeMs =
      _options.maxAgeMs || options.maxAgeMs || MAX_AGE_MS;
    const _generateCacheKey =
      _options.generateCacheKey ||
      options.generateCacheKey ||
      generateCacheKey;
    const _generateCacheMaxAge =
      _options.generateCacheMaxAge ||
      options.generateCacheMaxAge ||
      generateCacheMaxAge;
    const _shouldCache =
      _options.shouldCache ||
      options.shouldCache ||
      shouldCache;
    const _shouldInvalidateCache =
      _options.shouldInvalidateCache ||
      options.shouldInvalidateCache ||
      shouldInvalidateCache;
    const fnHash = encToFNV1A(asyncFn.toString());

    return async function (...args) {
      const cacheKey = _generateCacheKey(
        fnHash,
        version,
        args,
      );

      if (!_shouldInvalidateCache(args)) {
        const cacheResponse = await cacheStore.get(
          cacheKey,
        );

        if (cacheResponse.isSuccess) {
          return cacheResponse.value;
        }
      }

      const response = await asyncFn.apply(this, args);

      if (_shouldCache(response)) {
        cacheStore.set(
          cacheKey,
          response,
          _generateCacheMaxAge(maxAgeMs),
        ); // Silent fail.
      }

      return response;
    };
  };
}
