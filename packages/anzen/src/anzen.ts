export type AnzenResultSuccess<T> = ResultSuccess<T>;
export type AnzenResultFailure<E> = ResultFailure<E>;
export type AnzenAnyResult<E, T> =
  | AnzenResultFailure<E>
  | AnzenResultSuccess<T>;
type ExtractFailure<T extends readonly unknown[]> = Awaited<
  T[number]
> extends infer R
  ? R extends AnzenResultFailure<infer U>
    ? U
    : never
  : never;
type ExtractSuccess<T extends readonly unknown[]> = {
  [K in keyof T]: Awaited<T[K]> extends infer R
    ? R extends AnzenResultSuccess<infer U>
      ? U
      : never
    : never;
};
export type AnzenResultFn<E, T> = (
  ...args: unknown[]
) => AnzenAnyResult<E, T> | Promise<AnzenAnyResult<E, T>>;

export class ResultSuccess<T> {
  readonly isSuccess = true;
  readonly isFailure = false;
  #value: T;

  constructor(value: T) {
    this.#value = value;
  }

  getValue(): T {
    return this.#value;
  }

  getOrElse<V>(_: V): T {
    return this.#value;
  }

  getError(): void {
    throw new Error('Cannot get the error of a success.');
  }

  chain<V extends AnzenAnyResult<unknown, unknown>>(
    fn: (val: T) => V,
  ): V {
    return fn(this.#value);
  }

  elseChain(_: (val: T) => unknown): this {
    return this;
  }

  map<V>(fn: (val: T) => V): AnzenResultSuccess<V> {
    return new ResultSuccess(fn(this.#value));
  }

  elseMap(_: (val: T) => unknown): this {
    return this;
  }

  unwrap(): [this, T] {
    return [this, this.#value];
  }

  unsafeUnwrap(): T {
    return this.#value;
  }

  toJSON(): string {
    return JSON.stringify({
      value: this.#value,
      isSuccess: this.isSuccess,
    });
  }
}

export class ResultFailure<E> {
  readonly isSuccess = false;
  readonly isFailure = true;
  #error: E;

  constructor(err: E) {
    this.#error = err;
  }

  getValue(): void {
    throw new Error('Cannot get the value of a failure.');
  }

  getOrElse<T>(defaultVal: T): T {
    return defaultVal;
  }

  getError(): E {
    return this.#error;
  }

  chain(_: (err: E) => unknown): this {
    return this;
  }

  elseChain<V extends AnzenAnyResult<unknown, unknown>>(
    fn: (err: E) => V,
  ): V {
    return fn(this.#error);
  }

  map(_: (err: E) => unknown): this {
    return this;
  }

  elseMap<V>(fn: (err: E) => V): AnzenResultSuccess<V> {
    return new ResultSuccess(fn(this.#error));
  }

  unwrap<V = undefined>(defaultVal?: V): [this, V] {
    return [this, defaultVal as V];
  }

  unsafeUnwrap(): E {
    return this.#error;
  }

  toJSON(): string {
    return JSON.stringify({
      error: this.#error,
      isSuccess: this.isSuccess,
    });
  }
}

async function handleResult<E, T>(
  whenRes:
    | Promise<AnzenAnyResult<E, T>>
    | AnzenAnyResult<E, T>,
) {
  const res = await whenRes;
  return res.isSuccess
    ? res.getValue()
    : Promise.reject(res.getError());
}

export class Result {
  static success = <T>(val: T): AnzenResultSuccess<T> =>
    new ResultSuccess(val);

  static failure = <E>(err: E): AnzenResultFailure<E> =>
    new ResultFailure(err);

  static async promiseAll<
    const T extends (
      | AnzenAnyResult<unknown, unknown>
      | Promise<AnzenAnyResult<unknown, unknown>>
    )[],
  >(whenRes: T) {
    try {
      const vals = await Promise.all(
        whenRes.map(handleResult),
      );
      return Result.success(vals) as AnzenResultSuccess<
        ExtractSuccess<T>
      >;
    } catch (err) {
      return Result.failure(err) as AnzenResultFailure<
        ExtractFailure<T>
      >;
    }
  }

  static async unwrapPromiseAll<
    const T extends (
      | AnzenAnyResult<unknown, unknown>
      | Promise<AnzenAnyResult<unknown, unknown>>
    )[],
    const D extends unknown[] = unknown[],
  >(args: [D, ...T]) {
    const [defaultsVals, ...whenRes] = args;
    try {
      const vals = await Promise.all(
        whenRes.map(handleResult),
      );
      return [Result.success(vals), ...vals] as [
        AnzenResultSuccess<ExtractSuccess<T>>,
        ...ExtractSuccess<T>,
      ];
    } catch (err) {
      return [Result.failure(err), ...defaultsVals] as [
        AnzenResultFailure<ExtractFailure<T>>,
        ...ExtractSuccess<T>,
      ];
    }
  }

  static unwrap<T, E, D = undefined>(defaultVal?: D) {
    return (
      res: AnzenAnyResult<E, T>,
    ):
      | [AnzenResultFailure<E>, D]
      | [AnzenResultSuccess<T>, T] =>
      res.isSuccess
        ? [res, res.getValue()]
        : [res, defaultVal as D];
  }

  static fromJSON<T = unknown, E = unknown>(
    json: string,
  ): AnzenAnyResult<E, T> {
    const obj = JSON.parse(json);
    return obj.isSuccess
      ? new ResultSuccess<T>(obj.value)
      : new ResultFailure<E>(obj.error);
  }

  static fromSyncThrowable<T, E = unknown>(
    fn: () => T,
    parseErr?: (err: unknown) => E,
  ): AnzenAnyResult<E, T> {
    try {
      return Result.success(fn());
    } catch (err) {
      return Result.failure(parseErr?.(err) ?? (err as E));
    }
  }

  static async fromThrowable<T, E = unknown>(
    fn: () => Promise<T>,
    parseErr?: (err: unknown) => E,
  ): Promise<AnzenAnyResult<E, T>> {
    try {
      return Result.success(await fn());
    } catch (err) {
      return Result.failure(parseErr?.(err) ?? (err as E));
    }
  }
}
