export function deferredPromise<T = unknown>() {
  const {
    promise,
    resolve: settle,
    reject: fail,
  } = Promise.withResolvers<T>();
  let isPending = true;
  let isFulfilled = false;
  let isRejected = false;
  return {
    isFulfilled() {
      return isFulfilled;
    },
    isPending() {
      return isPending;
    },
    isRejected() {
      return isRejected;
    },
    // Flags flip synchronously on the first settle (the previous `.then`-based
    // version updated them a microtask later). Resolving with a thenable marks
    // `isFulfilled` optimistically, before that thenable settles.
    resolve(value: T | PromiseLike<T>) {
      if (isPending) {
        isPending = false;
        isFulfilled = true;
      }
      settle(value);
    },
    reject(reason?: unknown) {
      if (isPending) {
        isPending = false;
        isRejected = true;
      }
      fail(reason);
    },
    promise,
  };
}
