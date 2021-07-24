import { ResultFactory } from './types';

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
