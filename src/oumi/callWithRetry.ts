export function callWithRetry(fn) {
  function fnWithRetry(args, retryCount) {
    const result = fn(...args);

    if (result.isFailure && retryCount < 4) {
      return fnWithRetry(args, ++retryCount);
    }

    return result;
  }

  return function (...args) {
    return fnWithRetry(args, 0);
  };
}
