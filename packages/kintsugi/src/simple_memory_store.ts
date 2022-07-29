import { Result } from '@daisugi/anzen';

import { Code } from './code.js';
import { CacheStore } from './with_cache.js';

export class SimpleMemoryStore implements CacheStore {
  #store;

  constructor() {
    this.#store = Object.create(null);
  }

  get(cacheKey: string) {
    const value = this.#store[cacheKey];
    if (typeof value === 'undefined') {
      return Result.failure({ code: Code.NotFound });
    }
    return Result.success(value);
  }

  set(cacheKey: string, value: any) {
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
