export interface Fn {
  (...args: unknown[]): unknown;
}

export interface AsyncFn {
  (...args: any[]): Promise<unknown>;
}
