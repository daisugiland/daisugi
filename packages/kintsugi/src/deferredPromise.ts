export function deferredPromise() {
  let resolve;
  let reject;

  const promise = new Promise(
    (privateResolve, privateReject) => {
      resolve = privateResolve;
      reject = privateReject;
    },
  );

  return {
    resolve,
    reject,
    promise,
  };
}
