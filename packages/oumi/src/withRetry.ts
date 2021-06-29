import { waitFor } from './waitFor';

const STARTING_DELAY_MS = 100;
const MAX_DELAY_MS = 300;
const TIME_MULTIPLIER = 2;
const MAX_ATTEMPTS = 5;

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function fnWithRetry(asyncFn, args, attempt) {
  const result = asyncFn(...args);

  if (result.isFailure && attempt < MAX_ATTEMPTS) {
    const delayMs = Math.min(
      MAX_DELAY_MS,
      STARTING_DELAY_MS * TIME_MULTIPLIER ** attempt,
    );

    // Full jitter https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
    const delayWithJitterMs = randomBetween(0, delayMs);

    await waitFor(delayWithJitterMs);

    return fnWithRetry(asyncFn, args, attempt + 1);
  }

  return result;
}

export function withRetry(asyncFn) {
  return function (...args) {
    return fnWithRetry(asyncFn, args, 0);
  };
}
