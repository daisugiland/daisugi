export type AnzenResultOk<T> = ResultOk<T>;
export type AnzenResultErr<E> = ResultErr<E>;
export type AnzenAnyResult<E, T> =
  | AnzenResultErr<E>
  | AnzenResultOk<T>;
type ExtractErr<T extends readonly unknown[]> =
  Awaited<T[number]> extends infer R
    ? R extends AnzenResultErr<infer U>
      ? U
      : never
    : never;
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
  | AnzenResultOk<ExtractOk<T>>
  | AnzenResultErr<ExtractErr<T>>
> {
  try {
    const vals = await Promise.all(
      whenRes.map((r) => handleResult(r)),
    );
    return ok(vals) as AnzenResultOk<ExtractOk<T>>;
  } catch (error) {
    return err(error) as AnzenResultErr<ExtractErr<T>>;
  }
}

export async function unwrapPromiseAll<
  const T extends (
    | AnzenAnyResult<unknown, unknown>
    | Promise<AnzenAnyResult<unknown, unknown>>
  )[],
>(
  args: [Partial<ExtractOk<T>>, ...T],
): Promise<
  [
    (
      | AnzenResultOk<ExtractOk<T>>
      | AnzenResultErr<ExtractErr<T>>
    ),
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
      AnzenResultErr<ExtractErr<T>>,
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
