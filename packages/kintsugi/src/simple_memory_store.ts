import { result } from './result.js';
import { Code } from './code.js';
import { CacheStore } from './with_cache.js';

export class SimpleMemoryStore implements CacheStore {
  private store;

  constructor() {
    this.store = Object.create(null);
  }

  get(cacheKey: string) {
    const value = this.store[cacheKey];
    if (typeof value === 'undefined') {
      return result.fail({ code: Code.NotFound });
    }
    return result.ok(value);
  }

  set(cacheKey: string, value: any) {
    this.store[cacheKey] = value;
    return result.ok(value);
  }

  delete(cacheKey: string) {
    delete this.store[cacheKey];
    return result.ok(cacheKey);
  }

  weakDelete(cacheKey: string) {
    this.store[cacheKey] = undefined;
    return result.ok(cacheKey);
  }
}
