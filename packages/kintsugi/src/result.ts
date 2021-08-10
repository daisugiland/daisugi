export interface ResultOk<T> {
  isSuccess: true;
  isFailure: false;
  value: T;
  error: null;
}

export interface ResultFail<T> {
  isSuccess: false;
  isFailure: true;
  value: null;
  error: T;
}

export interface ResultFactory {
  ok<T>(value: T): ResultOk<T>;
  fail<T>(error: T): ResultFail<T>;
}

export type Result = ResultOk<any> | ResultFail<any>;

export interface ResultFn {
  (...args: any[]): Result | Promise<Result>;
}

export const result: ResultFactory = {
  ok(value) {
    return {
      isSuccess: true,
      isFailure: false,
      value,
      error: null,
    };
  },
  fail(error) {
    return {
      isSuccess: false,
      isFailure: true,
      value: null,
      error,
    };
  },
};
