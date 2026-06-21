export type AnzenResultOk<T> = ResultOk<T>;
export type AnzenResultErr<E> = ResultErr<E>;
export type AnzenAnyResult<E, T> =
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
) => AnzenAnyResult<E, T> | Promise<AnzenAnyResult<E, T>>;

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

  andThen<V extends AnzenAnyResult<unknown, unknown>>(
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

  getRaw(): T {
    return this.#value;
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

  orElse<V extends AnzenAnyResult<unknown, unknown>>(
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

  getRaw(): E {
    return this.#error;
  }

  toJSON(): string {
    return JSON.stringify({
      error: this.#error,
      isOk: this.isOk,
    });
  }
}

async function handleResult<E, T>(
  whenRes:
    | Promise<AnzenAnyResult<E, T>>
    | AnzenAnyResult<E, T>,
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
): value is AnzenAnyResult<unknown, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<symbol, unknown>)[anzenBrand] === true
  );
}

export async function promiseAll<
  const T extends (
    | AnzenAnyResult<unknown, unknown>
    | Promise<AnzenAnyResult<unknown, unknown>>
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
    | AnzenAnyResult<unknown, unknown>
    | Promise<AnzenAnyResult<unknown, unknown>>
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
    res: AnzenAnyResult<E, T>,
  ): [AnzenResultErr<E>, D] | [AnzenResultOk<T>, T] =>
    res.isOk ? [res, res.unwrap()] : [res, defaultVal as D];
}

export function fromJSON<E = unknown, T = unknown>(
  json: string,
): AnzenAnyResult<E, T> {
  const obj = JSON.parse(json);
  return obj.isOk
    ? new ResultOk<T>(obj.value)
    : new ResultErr<E>(obj.error);
}

export function fromSyncThrowable<E = unknown, T = unknown>(
  fn: () => T,
  parseErr?: (error: unknown) => E,
): AnzenAnyResult<E, T> {
  try {
    return ok(fn());
  } catch (error) {
    return err(parseErr?.(error) ?? (error as E));
  }
}

export async function fromThrowable<
  E = unknown,
  T = unknown,
>(
  fn: () => Promise<T>,
  parseErr?: (error: unknown) => E,
): Promise<AnzenAnyResult<E, T>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(parseErr?.(error) ?? (error as E));
  }
}

// A thenable that carries the Result combinators over an async boundary,
// so I/O-heavy code can keep chaining instead of awaiting and re-wrapping
// at every step. `await`-ing an AsyncResult yields the underlying Result.
export class AsyncResult<E, T> implements PromiseLike<
  AnzenAnyResult<E, T>
> {
  #promise: Promise<AnzenAnyResult<E, T>>;

  constructor(promise: Promise<AnzenAnyResult<E, T>>) {
    this.#promise = promise;
  }

  // The thenable surface is intentional: it lets callers `await` an
  // AsyncResult to get the underlying Result (the core ergonomic).
  // eslint-disable-next-line unicorn/no-thenable
  then<R1 = AnzenAnyResult<E, T>, R2 = never>(
    onFulfilled?:
      | ((
          value: AnzenAnyResult<E, T>,
        ) => R1 | PromiseLike<R1>)
      | null,
    onRejected?:
      | ((reason: unknown) => R2 | PromiseLike<R2>)
      | null,
  ): Promise<R1 | R2> {
    return this.#promise.then(onFulfilled, onRejected);
  }

  map<U>(
    fn: (val: T) => U | Promise<U>,
  ): AsyncResult<E, U> {
    return new AsyncResult(
      this.#promise.then(async (res) =>
        res.isOk ? ok(await fn(res.unwrap())) : res,
      ),
    );
  }

  mapErr<U>(
    fn: (error: E) => U | Promise<U>,
  ): AsyncResult<U, T> {
    return new AsyncResult(
      this.#promise.then(async (res) =>
        res.isErr ? err(await fn(res.unwrapErr())) : res,
      ),
    );
  }

  andThen<U, F>(
    fn: (
      val: T,
    ) =>
      | AnzenAnyResult<F, U>
      | AsyncResult<F, U>
      | Promise<AnzenAnyResult<F, U>>,
  ): AsyncResult<E | F, U> {
    return new AsyncResult<E | F, U>(
      this.#promise.then((res) =>
        res.isOk
          ? fn(res.unwrap())
          : (res as AnzenResultErr<E>),
      ) as Promise<AnzenAnyResult<E | F, U>>,
    );
  }

  orElse<U, F>(
    fn: (
      error: E,
    ) =>
      | AnzenAnyResult<F, U>
      | AsyncResult<F, U>
      | Promise<AnzenAnyResult<F, U>>,
  ): AsyncResult<F, T | U> {
    return new AsyncResult<F, T | U>(
      this.#promise.then((res) =>
        res.isErr
          ? fn(res.unwrapErr())
          : (res as AnzenResultOk<T>),
      ) as Promise<AnzenAnyResult<F, T | U>>,
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

export function okAsync<T>(val: T): AsyncResult<never, T> {
  return new AsyncResult(Promise.resolve(ok(val)));
}

export function errAsync<E>(
  error: E,
): AsyncResult<E, never> {
  return new AsyncResult(Promise.resolve(err(error)));
}

// Lifts a Promise that may reject into an AsyncResult: a resolved value
// becomes Ok, a rejection becomes Err. Without `parseErr` the error type
// is `unknown` — pass `parseErr` to obtain a typed error (matching
// neverthrow's `fromPromise(promise, errorFn)` contract).
export function fromPromise<T, E = unknown>(
  promise: Promise<T>,
  parseErr?: (error: unknown) => E,
): AsyncResult<E, T> {
  return new AsyncResult(
    promise.then(
      (val) => ok<T>(val),
      (error) =>
        err<E>(parseErr ? parseErr(error) : (error as E)),
    ),
  );
}

// Lifts a Promise that is already known not to reject (it resolves to a
// Result) into an AsyncResult.
export function fromSafePromise<E, T>(
  promise: Promise<AnzenAnyResult<E, T>>,
): AsyncResult<E, T> {
  return new AsyncResult(promise);
}
