export type AsyncFn = (...args: any[]) => Promise<any>;

// The wrapper returned by withCache/withRetry/withPool: same parameters as the
// wrapped function, always resolving through a promise.
export type WrappedFn<
  Fn extends (...args: any[]) => unknown,
> = (
  ...args: Parameters<Fn>
) => Promise<Awaited<ReturnType<Fn>>>;
