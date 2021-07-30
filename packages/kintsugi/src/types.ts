export interface ResultOk<T> {
  isSuccess: true;
  isFailure: false;
  value: T;
  error: null;
}

export interface ResultFail<T> {
  isSuccess: false;
  isFailure: true;
  value: null;
  error: T;
}

export interface ResultFactory {
  ok<T>(value: T): ResultOk<T>;
  fail<T>(error: T): ResultFail<T>;
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

export type AsyncFn = (...any) => Promise<any>;

export interface WithTimeoutOptions {
  maxTimeMs?: number;
}

export interface WithCircuitBreakerOptions {
  samples?: number;
  failureThresholdPercent?: number;
  returnToServiceAfterMs?: number;
}

export type ResultFn = (
  ...args: any[]
) => ResultOk<any> | ResultFail<any>;
