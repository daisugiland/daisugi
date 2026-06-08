import { Result } from '@daisugi/anzen';
import { Ayamari } from '@daisugi/ayamari';

import type { CacheStore } from './with_cache.js';

const { errFn } = new Ayamari();

export class SimpleMemoryStore implements CacheStore {
  #store: Record<string, unknown>;

  constructor() {
    this.#store = Object.create(null);
  }

  get(cacheKey: string) {
    const value = this.#store[cacheKey];
    if (value === undefined) {
      return Result.failure(
        errFn.NotFound('Not found in cache.'),
      );
    }
    return Result.success(value);
  }

  set(cacheKey: string, value: unknown) {
    this.#store[cacheKey] = value;
    return Result.success(value);
  }

  delete(cacheKey: string) {
    this.#store[cacheKey] = undefined;
    return Result.success(cacheKey);
  }

  weakDelete(cacheKey: string) {
    this.#store[cacheKey] = undefined;
    return Result.success(cacheKey);
  }
}
