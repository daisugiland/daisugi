import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  type AnzenResultFailure,
  type AnzenResultSuccess,
  Result,
} from '../anzen.js';
import type { Equal, Expect } from './utils/types.js';

function getRandomResult() {
  return Math.random() > 0.5
    ? Result.success(1)
    : Result.failure('a');
}

describe('Result', () => {
  describe('success', () => {
    it('should return expected value', () => {
      const result = Result.success(1);
      assert.equal(result.isSuccess, true);
      assert.equal(result.isFailure, false);
      type check = Expect<
        Equal<typeof result, AnzenResultSuccess<number>>
      >;
    });
  });

  describe('failure', () => {
    it('should return expected value', () => {
      const result = Result.failure(1);
      assert.equal(result.isSuccess, false);
      assert.equal(result.isFailure, true);
      type check = Expect<
        Equal<typeof result, AnzenResultFailure<number>>
      >;
    });
  });

  describe('getValue', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.success(1);
      assert.equal(resultSuccess.getValue(), 1);
      const resultFailure = Result.failure(1);
      assert.throws(() => resultFailure.getValue(), {
        message: 'Cannot get the value of a failure.',
      });
    });
  });

  describe('getError', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.success(1);
      assert.throws(() => resultSuccess.getError(), {
        message: 'Cannot get the error of a success.',
      });
      const resultFailure = Result.failure(1);
      assert.equal(resultFailure.getError(), 1);
    });
  });

  describe('chain', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.success(1);
      assert.deepEqual(
        resultSuccess.chain((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return Result.success(x + 1);
        }),
        Result.success(2),
      );
      const resultFailure = Result.failure(1);
      assert.equal(
        resultFailure.chain((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return Result.success(x + 1);
        }),
        resultFailure,
      );
    });
  });

  describe('elseChain', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.success(1);
      assert.deepEqual(
        resultSuccess.elseChain((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return Result.success(x + 1);
        }),
        resultSuccess,
      );
      const resultFailure = Result.failure(1);
      assert.deepEqual(
        resultFailure.elseChain((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return Result.success(x + 1);
        }),
        Result.success(2),
      );
    });
  });

  describe('chainElseChain', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.success(1);
      assert.deepEqual(
        resultSuccess
          .chain(() => Result.success('a'))
          .elseChain((x) => {
            type check = Expect<Equal<typeof x, string>>;
            return Result.success(2);
          }),
        Result.success('a'),
      );
      const resultFailure = Result.failure(1);
      assert.deepEqual(
        resultFailure
          .chain(() => Result.success('a'))
          .elseChain((x) => {
            type check = Expect<Equal<typeof x, number>>;
            return Result.success(2);
          }),
        Result.success(2),
      );
      const randomResult = getRandomResult()
        .chain((x) => {
          type check = Expect<
            Equal<typeof x, number | string>
          >;
          return Result.success('a');
        })
        .elseChain((x) => {
          type check = Expect<Equal<typeof x, string>>;
          return Result.failure(2);
        });
      type check = Expect<
        Equal<
          typeof randomResult,
          | AnzenResultFailure<number>
          | AnzenResultSuccess<string>
        >
      >;
    });
  });

  describe('map', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.success(1);
      assert.deepEqual(
        resultSuccess.map((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return x + 1;
        }),
        Result.success(2),
      );
      const resultFailure = Result.failure(1);
      assert.equal(
        resultFailure.map((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return x + 1;
        }),
        resultFailure,
      );
    });
  });

  describe('elseMap', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.success(1);
      assert.equal(
        resultSuccess.elseMap((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return x + 1;
        }),
        resultSuccess,
      );
      const resultFailure = Result.failure(1);
      assert.deepEqual(
        resultFailure.elseMap((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return x + 1;
        }),
        Result.success(2),
      );
    });
  });

  describe('mapElseMap', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.success(1);
      assert.deepEqual(
        resultSuccess
          .map(() => 'b')
          .elseMap((x) => {
            type check = Expect<Equal<typeof x, string>>;
            return 2;
          }),
        Result.success('b'),
      );
      const resultFailure = Result.failure(1);
      assert.deepEqual(
        resultFailure
          .map(() => 'a')
          .elseMap((x) => {
            type check = Expect<Equal<typeof x, number>>;
            return 2;
          }),
        Result.success(2),
      );
      const randomResult = getRandomResult()
        .map((x) => {
          type check = Expect<
            Equal<typeof x, number | string>
          >;
          return 'a';
        })
        .elseMap((x) => {
          type check = Expect<Equal<typeof x, string>>;
          return 2;
        });
      type check = Expect<
        Equal<
          typeof randomResult,
          | AnzenResultSuccess<number>
          | AnzenResultSuccess<string>
        >
      >;
    });
  });

  describe('getOrElse', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.success(1);
      assert.equal(resultSuccess.getOrElse(2), 1);
      const resultFailure = Result.failure(1);
      assert.equal(resultFailure.getOrElse(2), 2);
    });
  });

  describe('unsafeUnwrap', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.success(1);
      assert.equal(resultSuccess.unsafeUnwrap(), 1);
      const resultFailure = Result.failure(1);
      assert.equal(resultFailure.unsafeUnwrap(), 1);
    });
  });

  describe('toJSON', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.success(1);
      assert.deepEqual(
        resultSuccess.toJSON(),
        JSON.stringify({ value: 1, isSuccess: true }),
      );
      const resultFailure = Result.failure(1);
      assert.deepEqual(
        resultFailure.toJSON(),
        JSON.stringify({ error: 1, isSuccess: false }),
      );
    });
  });

  describe('fromJSON', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.fromJSON(
        JSON.stringify({ value: 1, isSuccess: true }),
      );
      assert.equal(resultSuccess.isSuccess, true);
      assert.equal(resultSuccess.isFailure, false);
      assert.equal(resultSuccess.getValue(), 1);
      const resultFailure = Result.fromJSON(
        JSON.stringify({
          error: 1,
          isSuccess: false,
        }),
      );
      assert.equal(resultFailure.isSuccess, false);
      assert.equal(resultFailure.isFailure, true);
      assert.equal(resultFailure.getError(), 1);
    });
  });

  describe('promiseAll', () => {
    it('when all promises are resolved with success, should return expected value', async () => {
      const promise1 = Promise.resolve(Result.success(1));
      const promise2 = async () => Result.success(2);
      const promise3 = () => Result.success('A');
      const result = await Result.promiseAll([
        promise1,
        promise2(),
        promise3(),
      ]);
      assert.equal(result.isSuccess, true);
      assert.equal(result.isFailure, false);
      assert.deepEqual(result.getValue(), [1, 2, 'A']);
      type check = Expect<
        Equal<
          typeof result,
          AnzenResultSuccess<[number, number, string]>
        >
      >;
    });

    it('when promises are resolved with failure, should return expected value', async () => {
      const promise1 = Promise.resolve(Result.failure(2));
      const result = await Result.promiseAll([promise1]);
      assert.equal(result.isSuccess, false);
      assert.equal(result.isFailure, true);
      assert.equal(result.getError(), 2);
      type check = Expect<
        Equal<typeof result, AnzenResultFailure<number>>
      >;
    });
  });

  describe('unwrap', () => {
    it('should return expected value', async () => {
      const successRes = Result.success(1);
      const failureRes = Result.failure(1);
      const fn = async () => successRes;
      const result = await fn().then(Result.unwrap());
      assert.deepEqual(result, [successRes, 1]);
      const fn2 = async () => failureRes;
      const result2 = await fn2().then(Result.unwrap());
      assert.deepEqual(result2, [failureRes, undefined]);
      const result3 = await fn2().then(Result.unwrap(1));
      assert.deepEqual(result3, [failureRes, 1]);
    });
  });

  describe('unwrapPromiseAll', () => {
    it('when all promises are resolved with success, should return expected value', async () => {
      const promise1 = Promise.resolve(Result.success(1));
      const promise2 = Promise.resolve(Result.success(2));
      const promise3 = Promise.resolve(Result.success('A'));
      const result = await Result.unwrapPromiseAll(
        [],
        [promise1, promise2, promise3],
      );
      assert.equal(result[0].isSuccess, true);
      assert.equal(result[0].isFailure, false);
      assert.deepEqual(result[0].getValue(), [1, 2, 'A']);
      assert.deepEqual(result, [result[0], [1, 2, 'A']]);
    });

    it('when promises are resolved with failure, should return expected value', async () => {
      const promise1 = Promise.resolve(Result.failure(2));
      const result = await Result.unwrapPromiseAll(
        [],
        [promise1],
      );
      assert.equal(result[0].isSuccess, false);
      assert.equal(result[0].isFailure, true);
      assert.equal(result[0].getError(), 2);
      assert.deepEqual(result, [result[0], []]);
    });
  });

  describe('fromThrowable', () => {
    it('when throwable is thrown, should return expected value', () => {
      const result = Result.fromSyncThrowable<Error, Error>(
        () => {
          throw new Error('err');
        },
      );
      assert.equal(result.isSuccess, false);
      assert.equal(result.isFailure, true);
      assert.equal(result.getError().message, 'err');
    });

    it('when throwable is not thrown, should return expected value', () => {
      const result = Result.fromSyncThrowable(() => 1);
      assert.equal(result.isSuccess, true);
      assert.equal(result.isFailure, false);
      assert.equal(result.getValue(), 1);
    });

    describe('parseError is provided', () => {
      it('when throwable is thrown, should return expected value', () => {
        const result = Result.fromSyncThrowable(
          () => {
            throw new Error('err');
          },
          (err) =>
            err instanceof Error
              ? err.message
              : String(err),
        );
        assert.equal(result.isSuccess, false);
        assert.equal(result.isFailure, true);
        assert.equal(result.getError(), 'err');
      });
    });

    describe('async', () => {
      it('when throwable is thrown, should return expected value', async () => {
        const result = await Result.fromThrowable<
          Error,
          Error
        >(async () => {
          throw new Error('err');
        });
        assert.equal(result.isSuccess, false);
        assert.equal(result.isFailure, true);
        assert.equal(result.getError().message, 'err');
      });
    });

    it('when throwable is not thrown, should return expected value', async () => {
      const result = await Result.fromThrowable(
        async () => 1,
      );
      assert.equal(result.isSuccess, true);
      assert.equal(result.isFailure, false);
      assert.equal(result.getValue(), 1);
    });
  });
});
