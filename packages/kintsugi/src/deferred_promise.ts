export function deferredPromise<T = unknown>() {
  let isPending = true;
  let isRejected = false;
  let isFulfilled = false;
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>(
    (privateResolve, privateReject) => {
      resolve = privateResolve;
      reject = privateReject;
    },
  ).then(
    (value) => {
      isFulfilled = true;
      isPending = false;
      return value;
    },
    (reason) => {
      isRejected = true;
      isPending = false;
      throw reason;
    },
  );
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
    resolve,
    reject,
    promise,
  };
}
