export interface Result<T, E> {
  isSuccess: boolean;
  isFailure: boolean;
  value: T;
  error: E;
}

export interface ResultFactory {
  ok(value: any): Result<any, null>;
  fail(error: any): Result<null, any>;
}

export type WithRetryRetryStrategy = (
  retryNumber: number,
) => number;

export type WithRetryShouldRetry = (
  response: any,
  retryNumber: number,
) => boolean;

export interface WithRetryOptions {
  startingDelayMs?: number;
  maxDelayMs?: number;
  timeFactor?: number;
  maxRetries?: number;
  retryStrategy?: WithRetryRetryStrategy;
  shouldRetry?: WithRetryShouldRetry;
}
