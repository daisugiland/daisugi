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
// stable across realms/bundles, so `isAnzenResult` works where `instanceof`
// can't when duplicate package copies make classes non reference-equal.
const anzenBrand = Symbol.for('@daisugi/anzen');

export class ResultOk<T> {
  declare readonly isOk: true;
  declare readonly isErr: false;
  #value: T;

  // Constant discriminants and brand live on the prototype, so each allocation
  // writes only #value. A static block keeps this safe under `sideEffects: false`
  // (unlike a top-level `prototype` assignment); the Record cast bypasses readonly.
  static {
    const proto = this.prototype as unknown as {
      isOk: boolean;
      isErr: boolean;
      [key: symbol]: unknown;
    };
    proto.isOk = true;
    proto.isErr = false;
    proto[anzenBrand] = true;
  }

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

  // Generator hook for `safeTry`: an Ok yields nothing and returns its
  // value, so `yield* okResult` evaluates to the unwrapped value.
  // eslint-disable-next-line require-yield
  *[Symbol.iterator](): Generator<never, T> {
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
  declare readonly isOk: false;
  declare readonly isErr: true;
  #error: E;

  static {
    const proto = this.prototype as unknown as {
      isOk: boolean;
      isErr: boolean;
      [key: symbol]: unknown;
    };
    proto.isOk = false;
    proto.isErr = true;
    proto[anzenBrand] = true;
  }

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

  // Generator hook for `safeTry`: an Err yields itself, short-circuiting the
  // enclosing generator. The throw is unreachable (the yield never resumes)
  // and only satisfies the `never` return type.
  *[Symbol.iterator](): Generator<
    AnzenResultErr<E>,
    never
  > {
    yield this;
    throw new Error(
      'safeTry generator resumed after an Err.',
    );
  }

  toJSON(): string {
    return JSON.stringify({
      error: this.#error,
      isOk: this.isOk,
    });
  }
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

// Rust's `?`-operator for Results, via generators. Inside `body`, `yield*`
// on a Result unwraps an Ok to its value or aborts the whole body to that
// Err. A sync generator returns a Result; an async one (`async function*`
// with `yield* await ...`) returns a Promise of one.
export function safeTry<E, T>(
  body: () => Generator<
    AnzenResultErr<E>,
    AnzenResult<E, T>
  >,
): AnzenResult<E, T>;
export function safeTry<E, T>(
  body: () => AsyncGenerator<
    AnzenResultErr<E>,
    AnzenResult<E, T>
  >,
): Promise<AnzenResult<E, T>>;
export function safeTry<E, T>(
  body:
    | (() => Generator<
        AnzenResultErr<E>,
        AnzenResult<E, T>
      >)
    | (() => AsyncGenerator<
        AnzenResultErr<E>,
        AnzenResult<E, T>
      >),
): AnzenResult<E, T> | Promise<AnzenResult<E, T>> {
  // The first step either yields an Err (short-circuit) or returns the
  // final Result; both surface in `.value`, so the generator is never
  // advanced again.
  const next = body().next();
  return next instanceof Promise
    ? next.then((res) => res.value)
    : next.value;
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
    // Settle everything once; scan in array order for the first Err.
    const results = await Promise.all(whenRes);
    const vals: unknown[] = [];
    for (const res of results) {
      if (res.isErr) return res;
      vals.push(res.unwrap());
    }
    return ok(vals) as AnzenResultOk<ExtractOk<T>>;
  } catch (error) {
    // A raw promise can reject with anything, so the failure type is
    // honestly `unknown`.
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
    const results = await Promise.all(whenRes);
    const vals: unknown[] = [];
    for (const res of results) {
      if (res.isErr) {
        return [res, ...defaultsVals] as [
          AnzenResultErr<unknown>,
          ...ExtractOk<T>,
        ];
      }
      vals.push(res.unwrap());
    }
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

export function fromThrowable<
  E = unknown,
  T = unknown,
  A extends readonly unknown[] = [],
>(
  fn: (...args: A) => T,
  parseErr?: (error: unknown) => E,
): (...args: A) => AnzenResult<E, T> {
  return (...args) => {
    try {
      return ok(fn(...args));
    } catch (error) {
      return err(parseErr?.(error) ?? (error as E));
    }
  };
}

export function fromAsyncThrowable<
  E = unknown,
  T = unknown,
  A extends readonly unknown[] = [],
>(
  fn: (...args: A) => Promise<T>,
  parseErr?: (error: unknown) => E,
): (...args: A) => Promise<AnzenResult<E, T>> {
  return (...args) => {
    try {
      return fn(...args).then(
        (val) => ok(val),
        (error) => err(parseErr?.(error) ?? (error as E)),
      );
    } catch (error) {
      return Promise.resolve(
        err(parseErr?.(error) ?? (error as E)),
      );
    }
  };
}
