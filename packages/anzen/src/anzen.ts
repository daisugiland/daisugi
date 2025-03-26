type ExtractFailure<T> = T extends ResultFailure<infer U>
  ? U
  : never;
type ExtractSuccess<T> = T extends ResultSuccess<infer U>
  ? U
  : never;
export type AwaitedResults<T extends readonly any[]> =
  Promise<
    | ResultSuccess<{
        [K in keyof T]: ExtractSuccess<
          Awaited<T[K]>
        > extends never
          ? never
          : ExtractSuccess<Awaited<T[K]>>;
      }>
    | (ExtractFailure<Awaited<T[number]>> extends never
        ? never
        : ResultFailure<ExtractFailure<Awaited<T[number]>>>)
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

  getOrElse<V>(_default: V): T {
    return this.#value;
  }

  getError(): never {
    throw new Error('Cannot get the error of a success.');
  }

  unwrap(): [this, T] {
    return [this, this.#value];
  }

  chain<V>(fn: (value: T) => V): V {
    return fn(this.#value);
  }

  elseChain(_: (value: T) => T): this {
    return this;
  }

  map<V>(fn: (value: T) => V): ResultSuccess<V> {
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

  unwrap(defaultValue?: unknown): [this, unknown] {
    return [this, defaultValue];
  }

  chain(_: (err: E) => E): this {
    return this;
  }

  elseChain<V>(fn: (err: E) => V): V {
    return fn(this.#error);
  }

  map(_: (err: E) => E): this {
    return this;
  }

  elseMap<V>(fn: (err: E) => V): ResultSuccess<V> {
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

async function handleResult<E, T>(
  whenResult: Promise<AnzenAnyResult<E, T>>,
): Promise<T> {
  const res = await whenResult;
  if (res.isFailure) {
    return Promise.reject(res.getError());
  }
  return res.getValue();
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Result {
  static success<T>(value: T): ResultSuccess<T> {
    return new ResultSuccess<T>(value);
  }

  static failure<E>(err: E): ResultFailure<E> {
    return new ResultFailure<E>(err);
  }

  static async promiseAll<T extends any[]>(
    whenResults: [...T],
  ): AwaitedResults<T> {
    const handledResults = whenResults.map(handleResult);
    try {
      const values = await Promise.all(handledResults);
      // @ts-expect-error
      return Result.success(values);
    } catch (err: any) {
      // @ts-expect-error
      return Result.failure(err);
    }
  }

  static async unwrapPromiseAll<T extends any[]>(
    defaultValue: unknown,
    whenResults: [...T],
  ): Promise<
    | [ResultSuccess<any[]>, any[]]
    | [ResultFailure<any>, any]
  > {
    const res = await Result.promiseAll(whenResults);
    return res.isFailure
      ? [res, defaultValue]
      : [res, res.getValue()];
  }

  static fromJSON(
    json: string,
  ): ResultSuccess<any> | ResultFailure<any> {
    const pojo = JSON.parse(json);
    return pojo.isSuccess
      ? new ResultSuccess(pojo.value)
      : new ResultFailure(pojo.error);
  }

  static unwrap(defaultValue?: unknown) {
    return (result: AnzenAnyResult<any, any>) => {
      return result.unwrap(defaultValue);
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
      .then((value) => {
        return Result.success(value);
      })
      .catch((err) => {
        return Result.failure(
          parseErr ? parseErr(err) : (err as E),
        );
      });
  }
}
