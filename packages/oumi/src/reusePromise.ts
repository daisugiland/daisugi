class Store {
  private store;

  constructor() {
    this.store = Object.create(null);
  }

  get(key: string) {
    return this.store[key];
  }

  set(key: string, value) {
    this.store[key] = value;
  }

  delete(key: string) {
    delete this.store[key];
  }

  weakDelete(key: string) {
    this.store[key] = undefined;
  }
}

export function reusePromise(asyncFn: (...any) => any) {
  const store = new Store();

  return async function (...args) {
    const key = JSON.stringify(args);

    let result = store.get(key);

    if (typeof result === 'undefined') {
      result = asyncFn(...args).then(
        (value) => {
          store.delete(key);

          return value;
        },
        (error) => {
          store.delete(key);

          throw error;
        },
      );

      store.set(key, result);
    }

    return result;
  };
}
