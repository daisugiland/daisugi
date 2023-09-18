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

async function handleResult(
  whenResult: Promise<
    AnzenResultFailure<any> | AnzenResultSuccess<any>
  >,
) {
  const response = await whenResult;
  if (response.isFailure) {
    return Promise.reject(response);
  }
  return response.getValue();
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Result {
  static success<T>(value: T) {
    return new ResultSuccess<T>(value);
  }

  static failure<E>(err: E) {
    return new ResultFailure<E>(err);
  }

  static async promiseAll(
    whenResults: Promise<
      AnzenResultFailure<any> | AnzenResultSuccess<any>
    >[],
  ) {
    const handledResults = whenResults.map(handleResult);
    try {
      const values = await Promise.all(handledResults);
      return Result.success(values);
    } catch (err: any) {
      if (
        !(
          err instanceof ResultFailure ||
          err instanceof ResultSuccess
        )
      ) {
        return Result.failure(err);
      }
      // We propagate result err.
      return err;
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
      return Result.failure(parseErr ? parseErr(err) : err);
    }
  }

  static async fromThrowable<E, T>(
    fn: () => Promise<T>,
    parseErr?: (err: any) => E,
  ) {
    return fn()
      .then((value) => {
        return Result.success(value);
      })
      .catch((err) => {
        return Result.failure(
          parseErr ? parseErr(err) : err,
        );
      });
  }
}
