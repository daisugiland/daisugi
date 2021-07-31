export type AsyncFn = (...args: any[]) => Promise<any>;

export interface WithTimeoutOptions {
  maxTimeMs?: number;
}

export interface WithCircuitBreakerOptions {
  samples?: number;
  failureThresholdPercent?: number;
  returnToServiceAfterMs?: number;
}
