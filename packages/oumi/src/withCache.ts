import { encToFNV1A } from './encToFNV1A';
import { NOT_FOUND_EXCEPTION } from './exceptionCodes';
import { ResultAsyncFn } from './types';
import { randomBetween } from './randomBetween';

interface WITH_CACHE_OPTIONS {
  version?: string;
  maxAgeMs?: number;
}

const MAX_AGE_MS = 1000 * 60 * 60 * 4; // 4h.
const VERSION = 'v1';

function generateCacheKey(
  fnHash: number,
  version: string,
  args: any[],
) {
  return `${fnHash}:${version}:${JSON.stringify(args)}`;
}

function generateCacheMaxAge(cacheMaxAgeMs: number) {
  return randomBetween(cacheMaxAgeMs * 0.75, cacheMaxAgeMs);
}

function shouldCache(response) {
  if (response.isSuccess) {
    return true;
  }

  // Cache NOT_FOUND_EXCEPTION by default.
  // https://docs.fastly.com/en/guides/http-status-codes-cached-by-default
  if (
    response.isFailure &&
    response.error.code === NOT_FOUND_EXCEPTION
  ) {
    return true;
  }

  return false;
}

export function createWithCache(redisCacheStore) {
  return function withCache(
    asyncFn: ResultAsyncFn,
    options: WITH_CACHE_OPTIONS = {},
  ) {
    const { version = VERSION, maxAgeMs = MAX_AGE_MS } =
      options;
    const fnHash = encToFNV1A(asyncFn.toString());

    return async function (...args) {
      const cacheKey = generateCacheKey(
        fnHash,
        version,
        args,
      );

      const cacheResponse = await redisCacheStore.get(
        cacheKey,
      );

      if (cacheResponse.isSuccess) {
        return cacheResponse.value;
      }

      const response = await asyncFn.apply(this, args);

      if (shouldCache(response)) {
        const cacheMaxAgeMs = generateCacheMaxAge(maxAgeMs);

        redisCacheStore.set(
          cacheKey,
          response,
          cacheMaxAgeMs,
        ); // Silent fail.
      }

      return response;
    };
  };
}
