import { waitFor } from './waitFor';

const startingDelayMs = 100;
const timeMultiplier = 2;
const maxAttempts = 5;

async function fnWithRetry(asyncFn, args, attempt) {
  const result = asyncFn(...args);

  if (result.isFailure && attempt < maxAttempts) {
    await waitFor(
      startingDelayMs * timeMultiplier ** attempt,
    );

    return fnWithRetry(asyncFn, args, attempt + 1);
  }

  return result;
}

// https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
// TODO: Add jitter.
export function withRetry(asyncFn) {
  return function (...args) {
    return fnWithRetry(asyncFn, args, 0);
  };
}
