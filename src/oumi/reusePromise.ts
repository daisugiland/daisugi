class Store {
  private store;

  constructor() {
    this.store = Object.create(null);
  }

  get(key) {
    return this.store[key];
  }

  set(key, value) {
    this.store[key] = value;
  }

  delete(key) {
    delete this.store[key];
  }

  weakDelete(key) {
    this.store[key] = undefined;
  }
}

export function reusePromise(promiseFn: (...any) => any) {
  const store = new Store();

  return async function (...args) {
    const cacheKey = JSON.stringify(args);

    let computedValue = store.get(cacheKey);

    if (typeof computedValue === 'undefined') {
      computedValue = promiseFn(...args).then(
        (value) => {
          store.delete(cacheKey);

          return value;
        },
        (error) => {
          store.delete(cacheKey);

          throw error;
        },
      );

      store.set(cacheKey, computedValue);
    }

    return computedValue;
  };
}
