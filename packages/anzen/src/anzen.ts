type ExtractFailure<T> = T extends ResultFailure<infer U> ? U : never;
type ExtractSuccess<T> = T extends ResultSuccess<infer U> ? U : never;
export type AwaitedResults<T extends readonly any[]> = Promise<
  | ResultSuccess<{
      [K in keyof T]: ExtractSuccess<Awaited<T[K]>> extends never
        ? never
        : ExtractSuccess<Awaited<T[K]>>;
    }>
  | (ExtractFailure<Awaited<T[number]>> extends never
      ? never
      : ResultFailure<ExtractFailure<Awaited<T[number]>>>)
>;​

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
  isSuccess = true as const;
  isFailure = false as const;
  #value: T;

  constructor(value: T) {
    this.#value = value;
  }

  getValue() {
    return this.#value;
  }

  getOrElse<V>(_: V) {
    return this.#value;
  }

  getError() {
    throw new Error('Cannot get the err of success.');
  }

  chain<V>(fn: (value: T) => V) {
    return fn(this.#value);
  }

  elseChain(_: (value: T) => T) {
    return this;
  }

  map<V>(fn: (value: T) => V) {
    return new ResultSuccess(fn(this.#value));
  }

  elseMap(_: (value: T) => T) {
    return this;
  }

  unsafeUnwrap() {
    return this.#value;
  }

  toJSON() {
    return JSON.stringify({
      value: this.#value,
      isSuccess: this.isSuccess,
    });
  }
}

export class ResultFailure<E> {
  isSuccess = false as const;
  isFailure = true as const;
  #error: E;

  constructor(err: E) {
    this.#error = err;
  }

  getValue() {
    throw new Error('Cannot get the value of failure.');
  }

  getOrElse<T>(value: T) {
    return value;
  }

  getError() {
    return this.#error;
  }

  chain(_: (err: E) => E) {
    return this;
  }

  elseChain<V>(fn: (err: E) => V) {
    return fn(this.#error);
  }

  map(_: (err: E) => E) {
    return this;
  }

  elseMap<V>(fn: (err: E) => V) {
    return new ResultSuccess(fn(this.#error));
  }

  unsafeUnwrap() {
    return this.#error;
  }

  toJSON() {
    return JSON.stringify({
      error: this.#error,
      isSuccess: this.isSuccess,
    });
  }
}

async function handleResult<E, T>(
  whenResult: Promise<AnzenAnyResult<E, T>>,
) {
  const res = await whenResult;
  if (res.isFailure) {
    return Promise.reject(res.getError());
  }
  return res.getValue();
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Result {
  static success<T>(value: T) {
    return new ResultSuccess<T>(value);
  }

  static failure<E>(err: E) {
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

  static fromJSON(json: string) {
    const pojo = JSON.parse(json);
    return pojo.isSuccess
      ? new ResultSuccess(pojo.value)
      : new ResultFailure(pojo.error);
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
