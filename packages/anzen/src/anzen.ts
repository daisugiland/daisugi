export type AnzenResultOk<T> = ResultOk<T>;
export type AnzenResultErr<E> = ResultErr<E>;
export type AnzenResult<E, T> =
  | AnzenResultErr<E>
  | AnzenResultOk<T>;
type ExtractOk<T extends readonly unknown[]> = {
  [K in keyof T]: Awaited<T[K]> extends infer R
    ? R extends AnzenResultOk<infer U>
      ? U
      : never
    : never;
};
export type AnzenResultFn<E, T> = (
  ...args: any[]
) => AnzenResult<E, T> | Promise<AnzenResult<E, T>>;

// Registry-global brand stamped on every Result. `Symbol.for` keeps it
// stable across realms/bundles (and duplicated module copies), so
// `isAnzenResult` works where `instanceof` can't — e.g. when two copies of
// the package are loaded, their classes are no longer reference-equal.
const anzenBrand = Symbol.for('@daisugi/anzen');

export class ResultOk<T> {
  readonly isOk = true;
  readonly isErr = false;
  readonly [anzenBrand] = true;
  #value: T;

  constructor(value: T) {
    this.#value = value;
  }

  unwrap(): T {
    return this.#value;
  }

  unwrapOr<V>(_: V): T {
    return this.#value;
  }

  unwrapErr(): never {
    throw new Error(
      'Cannot get the error of an Ok result.',
    );
  }

  andThen<V extends AnzenResult<unknown, unknown>>(
    fn: (val: T) => V,
  ): V {
    return fn(this.#value);
  }

  orElse(_: (val: T) => unknown): this {
    return this;
  }

  map<V>(fn: (val: T) => V): AnzenResultOk<V> {
    return new ResultOk(fn(this.#value));
  }

  mapErr(_: (val: T) => unknown): this {
    return this;
  }

  toTuple(): [this, T] {
    return [this, this.#value];
  }

  toJSON(): string {
    return JSON.stringify({
      value: this.#value,
      isOk: this.isOk,
    });
  }
}

export class ResultErr<E> {
  readonly isOk = false;
  readonly isErr = true;
  readonly [anzenBrand] = true;
  #error: E;

  constructor(error: E) {
    this.#error = error;
  }

  unwrap(): never {
    throw new Error(
      'Cannot get the value of an Err result.',
    );
  }

  unwrapOr<T>(defaultVal: T): T {
    return defaultVal;
  }

  unwrapErr(): E {
    return this.#error;
  }

  andThen(_: (err: E) => unknown): this {
    return this;
  }

  orElse<V extends AnzenResult<unknown, unknown>>(
    fn: (err: E) => V,
  ): V {
    return fn(this.#error);
  }

  map(_: (err: E) => unknown): this {
    return this;
  }

  mapErr<V>(fn: (err: E) => V): AnzenResultOk<V> {
    return new ResultOk(fn(this.#error));
  }

  toTuple<V = undefined>(defaultVal?: V): [this, V] {
    return [this, defaultVal as V];
  }

  toJSON(): string {
    return JSON.stringify({
      error: this.#error,
      isOk: this.isOk,
    });
  }
}

async function handleResult<E, T>(
  whenRes: Promise<AnzenResult<E, T>> | AnzenResult<E, T>,
) {
  const res = await whenRes;
  return res.isOk
    ? res.unwrap()
    : Promise.reject(res.unwrapErr());
}

export function ok<T>(val: T): AnzenResultOk<T> {
  return new ResultOk(val);
}

export function err<E>(error: E): AnzenResultErr<E> {
  return new ResultErr(error);
}

// Brand-based type guard. Reliable across realms/bundles, unlike
// `instanceof`, when more than one copy of the package is loaded.
export function isAnzenResult(
  value: unknown,
): value is AnzenResult<unknown, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<symbol, unknown>)[anzenBrand] === true
  );
}

export async function promiseAll<
  const T extends (
    | AnzenResult<unknown, unknown>
    | Promise<AnzenResult<unknown, unknown>>
  )[],
>(
  whenRes: T,
): Promise<
  AnzenResultOk<ExtractOk<T>> | AnzenResultErr<unknown>
> {
  try {
    const vals = await Promise.all(
      whenRes.map((r) => handleResult(r)),
    );
    return ok(vals) as AnzenResultOk<ExtractOk<T>>;
  } catch (error) {
    // A wrapped Err rejects with its own error, but a raw promise can
    // reject with anything, so the failure type is honestly `unknown`.
    return err(error);
  }
}

export async function unwrapPromiseAll<
  const T extends (
    | AnzenResult<unknown, unknown>
    | Promise<AnzenResult<unknown, unknown>>
  )[],
>(
  // A full-length defaults tuple is required: on failure these are spread
  // into the value positions, so a partial set would leave `undefined`
  // holes that the return type claims are present values.
  args: [ExtractOk<T>, ...T],
): Promise<
  [
    AnzenResultOk<ExtractOk<T>> | AnzenResultErr<unknown>,
    ...ExtractOk<T>,
  ]
> {
  const [defaultsVals, ...whenRes] = args;
  try {
    const vals = await Promise.all(
      whenRes.map((r) => handleResult(r)),
    );
    return [ok(vals), ...vals] as [
      AnzenResultOk<ExtractOk<T>>,
      ...ExtractOk<T>,
    ];
  } catch (error) {
    return [err(error), ...defaultsVals] as [
      AnzenResultErr<unknown>,
      ...ExtractOk<T>,
    ];
  }
}

export function toTuple<
  T = never,
  E = never,
  D = undefined,
>(defaultVal?: D) {
  return (
    res: AnzenResult<E, T>,
  ): [AnzenResultErr<E>, D] | [AnzenResultOk<T>, T] =>
    res.isOk ? [res, res.unwrap()] : [res, defaultVal as D];
}

export function fromJSON<E = unknown, T = unknown>(
  json: string,
): AnzenResult<E, T> {
  const obj = JSON.parse(json);
  return obj.isOk
    ? new ResultOk<T>(obj.value)
    : new ResultErr<E>(obj.error);
}

export function fromThrowable<E = unknown, T = unknown>(
  fn: () => T,
  parseErr?: (error: unknown) => E,
): AnzenResult<E, T> {
  try {
    return ok(fn());
  } catch (error) {
    return err(parseErr?.(error) ?? (error as E));
  }
}

export async function fromAsyncThrowable<
  E = unknown,
  T = unknown,
>(
  fn: () => Promise<T>,
  parseErr?: (error: unknown) => E,
): Promise<AnzenResult<E, T>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(parseErr?.(error) ?? (error as E));
  }
}

// Lazy counterpart of `fromAsyncThrowable`: adapts an async function that
// may throw or reject into a reusable Result-returning function (an
// `AnzenResultFn`), preserving its parameters. Each call defers into the
// thunk, so a synchronous throw on invocation is captured too.
export function wrapAsyncThrowable<
  A extends readonly unknown[],
  T,
  E = unknown,
>(
  fn: (...args: A) => Promise<T>,
  parseErr?: (error: unknown) => E,
): (...args: A) => Promise<AnzenResult<E, T>> {
  return (...args) =>
    fromAsyncThrowable(() => fn(...args), parseErr);
}

// A thenable that carries the Result combinators over an async boundary,
// so I/O-heavy code can keep chaining instead of awaiting and re-wrapping
// at every step. `await`-ing an ResultAsync yields the underlying Result.
export class ResultAsync<E, T> implements PromiseLike<
  AnzenResult<E, T>
> {
  #promise: Promise<AnzenResult<E, T>>;

  constructor(promise: Promise<AnzenResult<E, T>>) {
    this.#promise = promise;
  }

  // The thenable surface is intentional: it lets callers `await` an
  // ResultAsync to get the underlying Result (the core ergonomic).
  // eslint-disable-next-line unicorn/no-thenable
  then<R1 = AnzenResult<E, T>, R2 = never>(
    onFulfilled?:
      | ((value: AnzenResult<E, T>) => R1 | PromiseLike<R1>)
      | null,
    onRejected?:
      | ((reason: unknown) => R2 | PromiseLike<R2>)
      | null,
  ): Promise<R1 | R2> {
    return this.#promise.then(onFulfilled, onRejected);
  }

  map<U>(
    fn: (val: T) => U | Promise<U>,
  ): ResultAsync<E, U> {
    return new ResultAsync(
      this.#promise.then(async (res) =>
        res.isOk ? ok(await fn(res.unwrap())) : res,
      ),
    );
  }

  mapErr<U>(
    fn: (error: E) => U | Promise<U>,
  ): ResultAsync<U, T> {
    return new ResultAsync(
      this.#promise.then(async (res) =>
        res.isErr ? err(await fn(res.unwrapErr())) : res,
      ),
    );
  }

  andThen<U, F>(
    fn: (
      val: T,
    ) =>
      | AnzenResult<F, U>
      | ResultAsync<F, U>
      | Promise<AnzenResult<F, U>>,
  ): ResultAsync<E | F, U> {
    return new ResultAsync<E | F, U>(
      this.#promise.then((res) =>
        res.isOk
          ? fn(res.unwrap())
          : (res as AnzenResultErr<E>),
      ) as Promise<AnzenResult<E | F, U>>,
    );
  }

  orElse<U, F>(
    fn: (
      error: E,
    ) =>
      | AnzenResult<F, U>
      | ResultAsync<F, U>
      | Promise<AnzenResult<F, U>>,
  ): ResultAsync<F, T | U> {
    return new ResultAsync<F, T | U>(
      this.#promise.then((res) =>
        res.isErr
          ? fn(res.unwrapErr())
          : (res as AnzenResultOk<T>),
      ) as Promise<AnzenResult<F, T | U>>,
    );
  }

  async unwrap(): Promise<T> {
    return (await this.#promise).unwrap();
  }

  async unwrapErr(): Promise<E> {
    return (await this.#promise).unwrapErr();
  }

  async unwrapOr<V>(defaultVal: V): Promise<T | V> {
    return (await this.#promise).unwrapOr(defaultVal);
  }
}

export function okAsync<T>(val: T): ResultAsync<never, T> {
  return new ResultAsync(Promise.resolve(ok(val)));
}

export function errAsync<E>(
  error: E,
): ResultAsync<E, never> {
  return new ResultAsync(Promise.resolve(err(error)));
}

// Lifts a Promise that may reject into an ResultAsync: a resolved value
// becomes Ok, a rejection becomes Err. Without `parseErr` the error type
// is `unknown` — pass `parseErr` to obtain a typed error (matching
// neverthrow's `fromPromise(promise, errorFn)` contract).
export function fromPromise<T, E = unknown>(
  promise: Promise<T>,
  parseErr?: (error: unknown) => E,
): ResultAsync<E, T> {
  return new ResultAsync(
    promise.then(
      (val) => ok<T>(val),
      (error) =>
        err<E>(parseErr ? parseErr(error) : (error as E)),
    ),
  );
}

// Lifts a Promise that is already known not to reject (it resolves to a
// Result) into an ResultAsync.
export function fromSafePromise<E, T>(
  promise: Promise<AnzenResult<E, T>>,
): ResultAsync<E, T> {
  return new ResultAsync(promise);
}
