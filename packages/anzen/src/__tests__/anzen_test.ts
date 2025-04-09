import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  type AnzenAnyResult,
  type AnzenResultFailure,
  type AnzenResultSuccess,
  Result,
} from '../anzen.js';
import { type Equal, checkType } from './utils/types.js';

function getRandomRes() {
  return Math.random() > 0.5
    ? Result.success(1)
    : Result.failure('a');
}

describe('Result', () => {
  describe('success', () => {
    it('should return expected value', () => {
      const res = Result.success(1);
      assert.deepEqual(res, Result.success(12));
      assert.equal(res.isSuccess, true);
      assert.equal(res.isFailure, false);
      checkType<
        Equal<typeof res, AnzenResultSuccess<number>>
      >();
    });
  });

  describe('failure', () => {
    it('should return expected value', () => {
      const res = Result.failure(1);
      assert.deepEqual(res, Result.failure(12));
      assert.notDeepEqual(res, Result.success(1));
      assert.equal(res.isSuccess, false);
      assert.equal(res.isFailure, true);
      checkType<
        Equal<typeof res, AnzenResultFailure<number>>
      >();
    });
  });

  describe('getValue', () => {
    it('should return expected value', () => {
      const successRes = Result.success(1);
      assert.equal(successRes.getValue(), 1);
      const failureRes = Result.failure(1);
      assert.throws(() => failureRes.getValue(), {
        message: 'Cannot get the value of a failure.',
      });
    });
  });

  describe('getError', () => {
    it('should return expected value', () => {
      const successRes = Result.success(
        1,
      ) as AnzenAnyResult<void, number>;
      assert.throws(
        () => {
          const a = successRes.getError();
          const b = successRes.getValue();
          checkType<
            Equal<typeof a, void>,
            // biome-ignore lint/suspicious/noConfusingVoidType: We know that `b` is defined if `successRes` is a success.
            Equal<typeof b, void | number>
          >();
        },
        { message: 'Cannot get the error of a success.' },
      );
      const failureRes = Result.failure(1);
      assert.equal(failureRes.getError(), 1);
    });
  });

  describe('chain', () => {
    it('should return expected value', () => {
      assert.equal(
        Result.success(1)
          .chain((x) => {
            checkType<Equal<typeof x, number>>();
            return Result.success(x + 1);
          })
          .getValue(),
        2,
      );
      assert.equal(
        Result.failure(1)
          .chain((x) => {
            checkType<Equal<typeof x, number>>();
            return Result.success(x + 1);
          })
          .getError(),
        1,
      );
    });
  });

  describe('elseChain', () => {
    it('should return expected value', () => {
      assert.equal(
        Result.success(1)
          .elseChain((x) => {
            checkType<Equal<typeof x, number>>();
            return Result.success(x + 1);
          })
          .getValue(),
        1,
      );
      const failureRes = Result.failure(1);
      assert.equal(
        failureRes
          .elseChain((x) => {
            checkType<Equal<typeof x, number>>();
            return Result.success(x + 1);
          })
          .getValue(),
        2,
      );
    });
  });

  describe('chainElseChain', () => {
    it('should return expected value', () => {
      assert.equal(
        Result.success(1)
          .chain(() => Result.success('a'))
          .elseChain((x) => {
            checkType<Equal<typeof x, string>>();
            return Result.success(2);
          })
          .getValue(),
        'a',
      );
      assert.equal(
        Result.failure(1)
          .chain(() => Result.success('a'))
          .elseChain((x) => {
            checkType<Equal<typeof x, number>>();
            return Result.success(2);
          })
          .getValue(),
        2,
      );
      const randomRes = getRandomRes()
        .chain((x) => {
          checkType<Equal<typeof x, number | string>>();
          return Result.success('a');
        })
        .elseChain((x) => {
          checkType<Equal<typeof x, string>>();
          return Result.failure(2);
        });
      checkType<
        Equal<
          typeof randomRes,
          | AnzenResultFailure<number>
          | AnzenResultSuccess<string>
        >
      >();
    });
  });

  describe('map', () => {
    it('should return expected value', () => {
      assert.equal(
        Result.success(1)
          .map((x) => {
            checkType<Equal<typeof x, number>>();
            return x + 1;
          })
          .getValue(),
        2,
      );
      assert.equal(
        Result.failure(1)
          .map((x) => {
            checkType<Equal<typeof x, number>>();
            return x + 1;
          })
          .getError(),
        1,
      );
    });
  });

  describe('elseMap', () => {
    it('should return expected value', () => {
      assert.equal(
        Result.success(1)
          .elseMap((x) => {
            checkType<Equal<typeof x, number>>();
            return x + 1;
          })
          .getValue(),
        1,
      );
      assert.equal(
        Result.failure(1)
          .elseMap((x) => {
            checkType<Equal<typeof x, number>>();
            return x + 1;
          })
          .getValue(),
        2,
      );
    });
  });

  describe('mapElseMap', () => {
    it('should return expected value', () => {
      assert.equal(
        Result.success(1)
          .map(() => 'b')
          .elseMap((x) => {
            checkType<Equal<typeof x, string>>();
            return 2;
          })
          .getValue(),
        'b',
      );
      assert.equal(
        Result.failure(1)
          .map(() => 'a')
          .elseMap((x) => {
            checkType<Equal<typeof x, number>>();
            return 2;
          })
          .getValue(),
        2,
      );
      const randomRes = getRandomRes()
        .map((x) => {
          checkType<Equal<typeof x, number | string>>();
          return 'a';
        })
        .elseMap((x) => {
          checkType<Equal<typeof x, string>>();
          return 2;
        });
      checkType<
        Equal<
          typeof randomRes,
          | AnzenResultSuccess<number>
          | AnzenResultSuccess<string>
        >
      >();
    });
  });

  describe('getOrElse', () => {
    it('should return expected value', () => {
      const successRes = Result.success(1);
      assert.equal(successRes.getOrElse(2), 1);
      const failureRes = Result.failure(1);
      assert.equal(failureRes.getOrElse(2), 2);
    });
  });

  describe('unwrap', () => {
    it('should return expected value', () => {
      const success = Result.success(1).unwrap();
      assert.equal(success[0].getValue(), 1);
      assert.equal(success[1], 1);
      checkType<
        Equal<
          typeof success,
          [AnzenResultSuccess<number>, number]
        >
      >();
      const failure = Result.failure(1).unwrap();
      assert.equal(failure[0].getError(), 1);
      assert.equal(failure[1], undefined);
      checkType<
        Equal<
          typeof failure,
          [AnzenResultFailure<number>, undefined]
        >
      >();
      const failureWithDefault =
        Result.failure(1).unwrap(2);
      assert.equal(failureWithDefault[0].getError(), 1);
      assert.equal(failureWithDefault[1], 2);
      checkType<
        Equal<
          typeof failureWithDefault,
          [AnzenResultFailure<number>, number]
        >
      >();
    });
  });

  describe('unsafeUnwrap', () => {
    it('should return expected value', () => {
      const successRes = Result.success(1);
      assert.equal(successRes.unsafeUnwrap(), 1);
      const failureRes = Result.failure(1);
      assert.equal(failureRes.unsafeUnwrap(), 1);
    });
  });

  describe('toJSON', () => {
    it('should return expected value', () => {
      const successRes = Result.success(1);
      assert.deepEqual(
        successRes.toJSON(),
        JSON.stringify({ value: 1, isSuccess: true }),
      );
      const failureRes = Result.failure(1);
      assert.deepEqual(
        failureRes.toJSON(),
        JSON.stringify({ error: 1, isSuccess: false }),
      );
    });
  });

  describe('Result.fromJSON', () => {
    it('should return expected value', () => {
      const successRes = Result.fromJSON(
        JSON.stringify({ value: 1, isSuccess: true }),
      );
      assert.equal(successRes.isSuccess, true);
      assert.equal(successRes.isFailure, false);
      assert.equal(successRes.getValue(), 1);
      const failureRes = Result.fromJSON(
        JSON.stringify({
          error: 1,
          isSuccess: false,
        }),
      );
      assert.equal(failureRes.isSuccess, false);
      assert.equal(failureRes.isFailure, true);
      assert.equal(failureRes.getError(), 1);
    });
  });

  describe('Result.promiseAll', () => {
    it('when all promises are resolved with success, should return expected value', async () => {
      const promise1 = Promise.resolve(Result.success(1));
      const promise2 = async () => Result.success(2);
      const promise3 = () => Result.success('A');
      const res = await Result.promiseAll([
        promise1,
        promise2(),
        promise3(),
      ]);
      assert.equal(res.isSuccess, true);
      assert.equal(res.isFailure, false);
      assert.deepEqual(res.getValue(), [1, 2, 'A']);
      checkType<
        Equal<
          typeof res,
          AnzenResultSuccess<[number, number, string]>
        >
      >();
      const res2 = await Result.promiseAll([
        promise1,
        promise2(),
        promise3(),
        getRandomRes(),
      ]);
      checkType<
        Equal<
          typeof res2,
          | AnzenResultFailure<string>
          | AnzenResultSuccess<
              [number, number, string, number]
            >
        >
      >();
    });

    it('when promises are resolved with failure, should return expected value', async () => {
      const promise1 = Promise.resolve(Result.failure(2));
      const res = await Result.promiseAll([promise1]);
      assert.equal(res.isSuccess, false);
      assert.equal(res.isFailure, true);
      assert.equal(res.getError(), 2);
      checkType<
        Equal<typeof res, AnzenResultFailure<number>>
      >();
    });
  });

  describe('Result.unwrapPromiseAll', () => {
    it('when all promises are resolved with success, should return expected value', async () => {
      const promise1 = Promise.resolve(Result.success(1));
      const promise2 = Promise.resolve(Result.success(2));
      const promise3 = Promise.resolve(Result.success('A'));
      const [res, ...results] =
        await Result.unwrapPromiseAll([
          [],
          promise1,
          promise2,
          promise3,
        ]);
      if (res.isSuccess) {
        results;
      }
      assert.equal(res.isSuccess, true);
      assert.equal(res.isFailure, false);
      assert.deepEqual(results, [1, 2, 'A']);
      checkType<
        Equal<
          typeof res,
          AnzenResultSuccess<[number, number, string]>
        >,
        Equal<typeof results, [number, number, string]>
      >();
    });

    it('when promises are resolved with failure, should return expected value', async () => {
      const promise1 = Promise.resolve(Result.failure(2));
      const [res, ...results] =
        await Result.unwrapPromiseAll([[], promise1]);
      assert.equal(res.isSuccess, false);
      assert.equal(res.isFailure, true);
      assert.deepEqual(results, []);
      checkType<
        Equal<typeof res, AnzenResultFailure<number>>
      >();
    });
  });

  describe('Result.unwrap', () => {
    it('should return expected value', async () => {
      const successRes = Result.success(1);
      const failureRes = Result.failure(1);
      const fn = async () => successRes;
      const res = await fn().then(Result.unwrap());
      assert.deepEqual(res, [successRes, 1]);
      checkType<
        Equal<
          typeof res,
          [AnzenResultSuccess<number>, number]
        >
      >();
      const fn2 = async () => failureRes;
      const result2 = await fn2().then(Result.unwrap());
      assert.deepEqual(result2, [failureRes, undefined]);
      checkType<
        Equal<
          typeof result2,
          [AnzenResultFailure<number>, undefined]
        >
      >();
      const result3 = await fn2().then(Result.unwrap(1));
      assert.deepEqual(result3, [failureRes, 1]);
      checkType<
        Equal<
          typeof result3,
          [AnzenResultFailure<number>, number]
        >
      >();
    });
  });

  describe('Result.fromThrowable', () => {
    it('when throwable is thrown, should return expected value', () => {
      const res = Result.fromSyncThrowable<Error, Error>(
        () => {
          throw new Error('err');
        },
      );
      assert.equal(res.isSuccess, false);
      assert.equal(res.isFailure, true);
      assert.equal(res.getError().message, 'err');
    });

    it('when throwable is not thrown, should return expected value', () => {
      const res = Result.fromSyncThrowable(() => 1);
      assert.equal(res.isSuccess, true);
      assert.equal(res.isFailure, false);
      assert.equal(res.getValue(), 1);
    });

    describe('parseError is provided', () => {
      it('when throwable is thrown, should return expected value', () => {
        const res = Result.fromSyncThrowable(
          () => {
            throw new Error('err');
          },
          (err) =>
            err instanceof Error ? err.message : err,
        );
        assert.equal(res.isSuccess, false);
        assert.equal(res.isFailure, true);
        assert.equal(res.getError(), 'err');
      });
    });

    describe('async', () => {
      it('when throwable is thrown, should return expected value', async () => {
        const res = await Result.fromThrowable<
          Error,
          Error
        >(async () => {
          throw new Error('err');
        });
        assert.equal(res.isSuccess, false);
        assert.equal(res.isFailure, true);
        assert.equal(res.getError().message, 'err');
      });
    });

    it('when throwable is not thrown, should return expected value', async () => {
      const res = await Result.fromThrowable(async () => 1);
      assert.equal(res.isSuccess, true);
      assert.equal(res.isFailure, false);
      assert.equal(res.getValue(), 1);
    });
  });
});
