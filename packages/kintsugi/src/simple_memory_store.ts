import { Result } from '@daisugi/anzen';
import { Ayamari } from '@daisugi/ayamari';

import type { CacheStore } from './with_cache.js';

const { errFn } = new Ayamari();

interface StoreEntry {
  value: unknown;
  expiresAt: number;
}

export class SimpleMemoryStore implements CacheStore {
  #store: Map<string, StoreEntry>;

  constructor() {
    this.#store = new Map();
  }

  get(cacheKey: string) {
    const entry = this.#store.get(cacheKey);
    if (
      entry !== undefined &&
      entry.expiresAt >= Date.now()
    ) {
      return Result.success(entry.value);
    }
    // Missing or expired; drop any stale entry and report a miss.
    this.#store.delete(cacheKey);
    return Result.failure(
      errFn.NotFound('Not found in cache.'),
    );
  }

  set(cacheKey: string, value: unknown, maxAgeMs?: number) {
    const expiresAt =
      maxAgeMs === undefined
        ? Number.POSITIVE_INFINITY
        : Date.now() + maxAgeMs;
    this.#store.set(cacheKey, { value, expiresAt });
    // Writes ack with the affected key, matching `delete`; the read payload
    // belongs to `get`. Callers ignore this, so keep both writes consistent.
    return Result.success(cacheKey);
  }

  delete(cacheKey: string) {
    this.#store.delete(cacheKey);
    return Result.success(cacheKey);
  }
}
