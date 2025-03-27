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

export type AwaitedResults<T extends readonly unknown[]> =
  Promise<
    | AnzenResultSuccess<{
        [K in keyof T]: ExtractSuccess<Awaited<T[K]>>;
      }>
    | AnzenResultFailure<ExtractFailure<Awaited<T[number]>>>
  >;

export type AnzenAnyResult<E, T> =
  | AnzenResultFailure<E>
  | AnzenResultSuccess<T>;
export type AnzenResultFn<E, T> = (
  ...args: any[]
) => AnzenAnyResult<E, T> | Promise<AnzenAnyResult<E, T>>;
export type AnzenResultSuccess<T> = ResultSuccess<T>;
export type AnzenResultFailure<E> = ResultFailure<E>;
export type AnzenResult = Result;

export class ResultSuccess<T> {
  readonly isSuccess = true as const;
  readonly isFailure = false as const;
  #value: T;

  constructor(value: T) {
    this.#value = value;
  }

  getValue(): T {
    return this.#value;
  }

  getOrElse<V>(_defaultValue: V): T {
    return this.#value;
  }

  getError(): never {
    throw new Error('Cannot get the error of a success.');
  }

  unwrap(): [this, T] {
    return [this, this.#value];
  }

  chain<E2, U>(
    fn: (value: T) => AnzenAnyResult<E2, U>,
  ): AnzenAnyResult<E2, U> {
    return fn(this.#value);
  }

  elseChain<E2, U>(
    _: (error: any) => AnzenAnyResult<E2, U>,
  ): this {
    return this;
  }

  map<V>(fn: (value: T) => V): AnzenResultSuccess<V> {
    return new ResultSuccess(fn(this.#value));
  }

  elseMap(_: (value: T) => T): this {
    return this;
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
  readonly isSuccess = false as const;
  readonly isFailure = true as const;
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

  unwrap<V = unknown>(defaultValue?: V): [this, V] {
    return [this, defaultValue as V];
  }

  chain<E2, U>(
    _: (value: any) => AnzenAnyResult<E2, U>,
  ): this {
    return this;
  }

  elseChain<E2, U>(
    fn: (err: E) => AnzenAnyResult<E2, U>,
  ): AnzenAnyResult<E2, U> {
    return fn(this.#error);
  }

  map(_: (err: E) => E): this {
    return this;
  }

  elseMap<V>(fn: (err: E) => V): AnzenResultSuccess<V> {
    return new ResultSuccess(fn(this.#error));
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

async function handleResult<T>(
  whenResult:
    | Promise<AnzenAnyResult<any, T>>
    | AnzenAnyResult<any, T>,
): Promise<T> {
  const res = await whenResult;
  if (res.isFailure) {
    return Promise.reject(res.getError());
  }
  return res.getValue();
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Result {
  static success<T>(value: T): AnzenResultSuccess<T> {
    return new ResultSuccess<T>(value);
  }

  static failure<E>(err: E): AnzenResultFailure<E> {
    return new ResultFailure<E>(err);
  }

  static async promiseAll<
    T extends readonly (
      | Promise<AnzenAnyResult<any, any>>
      | AnzenAnyResult<any, any>
    )[],
  >(whenResults: [...T]): AwaitedResults<T> {
    const handledResults = whenResults.map(handleResult);
    try {
      const values = await Promise.all(handledResults);
      return Result.success(
        values,
      ) as unknown as AwaitedResults<T>;
    } catch (err: any) {
      return Result.failure(
        err,
      ) as unknown as AwaitedResults<T>;
    }
  }

  static async unwrapPromiseAll<
    T extends readonly (
      | Promise<AnzenAnyResult<any, any>>
      | AnzenAnyResult<any, any>
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

  static fromJSON(
    json: string,
  ): AnzenResultSuccess<any> | AnzenResultFailure<any> {
    const pojo = JSON.parse(json);
    return pojo.isSuccess
      ? new ResultSuccess(pojo.value)
      : new ResultFailure(pojo.error);
  }

  static unwrap<E, T, V = T>(
    defaultValue?: V,
  ): (
    result: AnzenAnyResult<E, T>,
  ) => [AnzenAnyResult<E, T>, T | V] {
    return (result) => {
      if (result.isSuccess) {
        return [result, result.getValue()];
      }
      return [result, defaultValue as V];
    };
  }

  static fromSyncThrowable<E, T>(
    fn: () => T,
    parseErr?: (err: any) => E,
  ) {
    try {
      return Result.success(fn());
    } catch (err: any) {
      return Result.failure(
        parseErr ? parseErr(err) : (err as E),
      );
    }
  }

  static async fromThrowable<E, T>(
    fn: () => Promise<T>,
    parseErr?: (err: unknown) => E,
  ) {
    return fn()
      .then((value) => Result.success(value))
      .catch((err) =>
        Result.failure(
          parseErr ? parseErr(err) : (err as E),
        ),
      );
  }
}
