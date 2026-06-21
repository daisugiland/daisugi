import { Result } from '@daisugi/anzen';
import { Ayamari } from '@daisugi/ayamari';

import type { CacheStore } from './with_cache.js';

const defaultMaxSize = 1000;

// `new Ayamari()` builds its error-factory records by iterating every error
// code, so it is kept out of module scope and created lazily on the first
// cache miss. This keeps the module free of top-level side effects (honoring
// the package's `sideEffects: false`) and shares one factory across stores.
let ayamari: Ayamari<unknown> | undefined;
function notFoundErr() {
  return (ayamari ??= new Ayamari()).errFn.NotFound(
    'Not found in cache.',
  );
}

interface StoreEntry {
  value: unknown;
  expiresAt: number;
}

interface SimpleMemoryStoreOpts {
  maxSize?: number;
}

export class SimpleMemoryStore implements CacheStore {
  #store: Map<string, StoreEntry>;
  #maxSize: number;

  constructor(opts: SimpleMemoryStoreOpts = {}) {
    this.#store = new Map();
    this.#maxSize = opts.maxSize ?? defaultMaxSize;
  }

  get(cacheKey: string) {
    const entry = this.#store.get(cacheKey);
    if (
      entry !== undefined &&
      entry.expiresAt >= Date.now()
    ) {
      // Reinsert to mark the key as most-recently-used.
      this.#store.delete(cacheKey);
      this.#store.set(cacheKey, entry);
      return Result.success(entry.value);
    }
    // Missing or expired; drop any stale entry and report a miss.
    this.#store.delete(cacheKey);
    return Result.failure(notFoundErr());
  }

  set(cacheKey: string, value: unknown, maxAgeMs?: number) {
    const expiresAt =
      maxAgeMs === undefined
        ? Number.POSITIVE_INFINITY
        : Date.now() + maxAgeMs;
    // Reinsert so the key becomes most-recently-used.
    this.#store.delete(cacheKey);
    this.#store.set(cacheKey, { value, expiresAt });
    // Bound memory: evict least-recently-used entries past the cap.
    while (this.#store.size > this.#maxSize) {
      const oldestKey = this.#store.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      this.#store.delete(oldestKey);
    }
    // Writes ack with the affected key, matching `delete`; the read payload
    // belongs to `get`. Callers ignore this, so keep both writes consistent.
    return Result.success(cacheKey);
  }

  delete(cacheKey: string) {
    this.#store.delete(cacheKey);
    return Result.success(cacheKey);
  }
}
