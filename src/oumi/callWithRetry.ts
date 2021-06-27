import { waitFor } from './waitFor';

const startingDelayMs = 100;
const timeMultiplier = 2;
const maxAttempts = 5;

// https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
export function callWithRetry(fn) {
  async function fnWithRetry(args, attempt) {
    const result = fn(...args);

    if (result.isFailure && attempt < maxAttempts) {
      await waitFor(
        startingDelayMs * timeMultiplier ** attempt,
      );

      return fnWithRetry(args, attempt + 1);
    }

    return result;
  }

  return function (...args) {
    return fnWithRetry(args, 0);
  };
}
