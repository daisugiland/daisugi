type OptionalReturnType<V> = V extends (err: any) => any
  ? ReturnType<V>
  : any;
export type AnzenAnyResult<T, E> =
  | ResultFailure<T>
  | ResultSuccess<E>;
export interface AnzenResultFn<T, E> {
  (...args: any[]):
    | AnzenAnyResult<T, E>
    | Promise<AnzenAnyResult<T, E>>;
}
export type AnzenResultSuccess<T> = ResultSuccess<T>;
export type AnzenResultFailure<T> = ResultFailure<T>;
export type AnzenResult = Result;

// Duck type validation.
function isFnAsync(fn: any) {
  return fn.constructor.name === 'AsyncFunction';
}

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

export class ResultFailure<T> {
  isSuccess = false as const;
  isFailure = true as const;
  #error: T;
  constructor(err: T) {
    this.#error = err;
  }
  getValue() {
    throw new Error('Cannot get the value of failure.');
  }
  getError() {
    return this.#error;
  }
  chain(_: (err: T) => T) {
    return this;
  }
  elseChain<V>(fn: (err: T) => V) {
    return fn(this.#error);
  }
  map(_: (err: T) => T) {
    return this;
  }
  elseMap<V>(fn: (err: T) => V) {
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

export class Result {
  static success<T>(value: T) {
    return new ResultSuccess<T>(value);
  }
  static failure<T>(err: T) {
    return new ResultFailure<T>(err);
  }
  static async promiseAll(
    results: Promise<
      AnzenResultFailure<any> | AnzenResultSuccess<any>
    >[],
  ) {
    const handledResults = results.map(handleResult);
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
  static fromThrowable<
    T extends (...args: any[]) => any,
    V extends (err: any) => any,
  >(fn: T, parseError?: V) {
    return function (
      ...args: Parameters<T>
    ):
      | AnzenResultSuccess<Awaited<ReturnType<T>>>
      | AnzenResultFailure<OptionalReturnType<V>> {
      try {
        if (isFnAsync(fn)) {
          return fn(...args)
            .then(Result.success)
            .catch((err: any) =>
              Result.failure(
                parseError ? parseError(err) : err,
              ),
            );
        }
        return Result.success(fn(...args));
      } catch (err: any) {
        return Result.failure(
          parseError ? parseError(err) : err,
        );
      }
    };
  }
}
