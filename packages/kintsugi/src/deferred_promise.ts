export function deferredPromise() {
  let isPending = true;
  let isRejected = false;
  let isFulfilled = false;
  let resolve!: (value?: any) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise((
    privateResolve,
    privateReject,
  ) => {
    resolve = privateResolve;
    reject = privateReject;
  }).then(
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
