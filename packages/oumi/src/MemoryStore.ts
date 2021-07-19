export class MemoryStore {
  private store;

  constructor() {
    this.store = Object.create(null);
  }

  get(cacheKey: string) {
    return this.store[cacheKey];
  }

  set(cacheKey: string, value) {
    this.store[cacheKey] = value;
  }

  delete(cacheKey: string) {
    delete this.store[cacheKey];
  }

  weakDelete(cacheKey: string) {
    this.store[cacheKey] = undefined;
  }
}
