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
    throw new Error('Cannot get the error of success.');
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
  constructor(error: T) {
    this.#error = error;
  }
  getValue() {
    throw new Error('Cannot get the value of failure.');
  }
  getError() {
    return this.#error;
  }
  chain(_: (error: T) => T) {
    return this;
  }
  elseChain<V>(fn: (error: T) => V) {
    return fn(this.#error);
  }
  map(_: (error: T) => T) {
    return this;
  }
  elseMap<V>(fn: (error: T) => V) {
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
    ResultFailure<any> | ResultSuccess<any>
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
  static failure<T>(error: T) {
    return new ResultFailure<T>(error);
  }
  static async promiseAll(
    results: Promise<
      ResultFailure<any> | ResultSuccess<any>
    >[],
  ) {
    const handledResults = results.map(handleResult);
    try {
      const values = await Promise.all(handledResults);
      return Result.success(values);
    } catch (error: any) {
      if (
        !(error instanceof ResultFailure) && !(
          error instanceof ResultSuccess
        )
      ) {
        return Result.failure(error);
      }
      // We propagate result error.
      return error;
    }
  }
  static fromJSON(json: string) {
    const pojo = JSON.parse(json);
    return pojo.isSuccess ? new ResultSuccess(pojo.value) : new ResultFailure(
      pojo.error,
    );
  }
}
