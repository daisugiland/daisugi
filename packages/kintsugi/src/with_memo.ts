import { reusePromise } from './reuse_promise.js';
import { SimpleMemoryStore } from './simple_memory_store.js';
import type { AsyncFn, WrappedFn } from './types.js';
import {
  type WithCacheOpts,
  withCache,
} from './with_cache.js';

interface WithMemoOpts extends WithCacheOpts {
  // Caps the default in-memory store; ignored when an explicit `cacheStore`
  // is supplied.
  maxSize?: number;
}

// Memoize an async function: cache its results (LRU, via withCache) and share
// a single in-flight execution across concurrent callers with the same key
// (via reusePromise, avoiding a cold-cache stampede). Failure caching follows
// withCache's `shouldCache` default; override it to change that.
export function withMemo<Fn extends AsyncFn>(
  fn: Fn,
  opts: WithMemoOpts = {},
): WrappedFn<Fn> {
  const { maxSize, cacheStore, ...cacheOpts } = opts;
  return withCache(reusePromise(fn), {
    ...cacheOpts,
    cacheStore:
      cacheStore ??
      new SimpleMemoryStore(
        maxSize === undefined ? {} : { maxSize },
      ),
  }) as WrappedFn<Fn>;
}
