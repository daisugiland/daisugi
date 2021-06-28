export interface Result<T, E> {
  isSuccess: boolean;
  isFailure: boolean;
  value: T;
  error: E;
}

export interface ResultFactory {
  ok(value: any): Result<any, null>;
  fail(error: any): Result<null, any>;
}
