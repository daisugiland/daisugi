export type Fn = (...args: any[]) => any;

export interface WithCircuitBreakerOptions {
  samples?: number;
  failureThresholdPercent?: number;
  returnToServiceAfterMs?: number;
}
