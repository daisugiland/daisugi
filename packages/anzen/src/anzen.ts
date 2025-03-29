export type AnzenResultSuccess<T> = ResultSuccess<T>;
export type AnzenResultFailure<E> = ResultFailure<E>;
export type AnzenResultType<E, T> =
  | AnzenResultFailure<E>
  | AnzenResultSuccess<T>;
type ExtractFailure<T> = T extends AnzenResultFailure<
  infer U
>
  ? U
  : never;
type ExtractSuccess<T> = T extends AnzenResultSuccess<
  infer U
>
  ? U
  : never;
type AwaitedResults<T extends unknown[]> = Promise<
  | AnzenResultSuccess<{
      [K in keyof T]: ExtractSuccess<Awaited<T[K]>>;
    }>
  | AnzenResultFailure<ExtractFailure<Awaited<T[number]>>>
>;
export type AnzenResultFn<E, T> = (
  ...args: any[]
) =>
  | AnzenResultSuccess<T>
  | AnzenResultFailure<E>
  | Promise<AnzenResultFailure<E> | AnzenResultSuccess<T>>;

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

  getError(): never {
    throw new Error('Cannot get the error of a success.');
  }

  chain<
    V extends
      | AnzenResultSuccess<unknown>
      | AnzenResultFailure<unknown>,
  >(fn: (value: T) => V): V {
    return fn(this.#value);
  }

  elseChain(_: (value: T) => any): this {
    return this;
  }

  map<V>(fn: (value: T) => V): AnzenResultSuccess<V> {
    return new ResultSuccess(fn(this.#value));
  }

  elseMap(_: (value: T) => any): this {
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

  getValue(): never {
    throw new Error('Cannot get the value of a failure.');
  }

  getOrElse<T>(defaultValue: T): T {
    return defaultValue;
  }

  getError(): E {
    return this.#error;
  }

  chain(_: (err: E) => any): this {
    return this;
  }

  elseChain<
    V extends
      | AnzenResultSuccess<unknown>
      | AnzenResultFailure<unknown>,
  >(fn: (err: E) => V): V {
    return fn(this.#error);
  }

  map(_: (err: E) => any): this {
    return this;
  }

  elseMap<V>(fn: (err: E) => V): AnzenResultSuccess<V> {
    return new ResultSuccess(fn(this.#error));
  }

  unwrap<V = unknown>(defaultValue?: V): [this, V] {
    return [this, defaultValue as V];
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

async function handleResult<T, E>(
  whenResult:
    | Promise<AnzenResultSuccess<T> | AnzenResultFailure<E>>
    | Awaited<
        AnzenResultSuccess<T> | AnzenResultFailure<E>
      >,
): Promise<T> {
  const res = await whenResult;
  if (res.isFailure) {
    return Promise.reject(res.getError());
  }
  return res.getValue();
}

export class Result {
  static success<T>(value: T): AnzenResultSuccess<T> {
    return new ResultSuccess(value);
  }

  static failure<E>(err: E): AnzenResultFailure<E> {
    return new ResultFailure(err);
  }

  static async promiseAll<
    const T extends (
      | Promise<
          AnzenResultSuccess<any> | AnzenResultFailure<any>
        >
      | Awaited<
          AnzenResultSuccess<any> | AnzenResultFailure<any>
        >
    )[],
  >(whenResults: [...T]): AwaitedResults<T> {
    const handledResults = whenResults.map(handleResult);
    try {
      const values = await Promise.all(handledResults);
      return Result.success(
        values as {
          [K in keyof T]: ExtractSuccess<T[K]>;
        },
      );
    } catch (err) {
      return Result.failure(
        err as ExtractFailure<T[number]>,
      );
    }
  }

  static async unwrapPromiseAll<
    T extends readonly (
      | Promise<AnzenResultType<any, any>>
      | AnzenResultType<any, any>
    )[],
  >(
    defaultValue: unknown,
    whenResults: [...T],
  ): Promise<
    | [
        AnzenResultSuccess<{
          [K in keyof T]: ExtractSuccess<Awaited<T[K]>>;
        }>,
        { [K in keyof T]: ExtractSuccess<Awaited<T[K]>> },
      ]
    | [
        AnzenResultFailure<
          ExtractFailure<Awaited<T[number]>>
        >,
        unknown,
      ]
  > {
    const res = await Result.promiseAll(whenResults);
    if (res.isFailure) {
      return [res, defaultValue];
    }
    const value = res.getValue();
    return [res, value];
  }

  static unwrap<E, T, V = T>(
    defaultValue?: V,
  ): (
    result: AnzenResultType<E, T>,
  ) => [AnzenResultType<E, T>, T | V] {
    return (result) => {
      if (result.isSuccess) {
        return [result, result.getValue()];
      }
      return [result, defaultValue as V];
    };
  }

  static fromJSON<T = any, E = any>(
    json: string,
  ): AnzenResultSuccess<T> | AnzenResultFailure<E> {
    const pojo = JSON.parse(json);
    return pojo.isSuccess
      ? new ResultSuccess<T>(pojo.value)
      : new ResultFailure<E>(pojo.error);
  }

  static fromSyncThrowable<T, E = unknown>(
    fn: () => T,
    parseErr?: (err: unknown) => E,
  ): AnzenResultSuccess<T> | AnzenResultFailure<E> {
    try {
      return Result.success(fn());
    } catch (err) {
      return Result.failure(parseErr?.(err) ?? (err as E));
    }
  }

  static async fromThrowable<T, E = unknown>(
    fn: () => Promise<T>,
    parseErr?: (err: unknown) => E,
  ): Promise<
    AnzenResultSuccess<T> | AnzenResultFailure<E>
  > {
    try {
      const value = await fn();
      return Result.success(value);
    } catch (err) {
      return Result.failure(parseErr?.(err) ?? (err as E));
    }
  }
}
