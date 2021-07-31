export type AsyncFn = (...args: any[]) => Promise<any>;

export interface WithCircuitBreakerOptions {
  samples?: number;
  failureThresholdPercent?: number;
  returnToServiceAfterMs?: number;
}
