import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  type AnzenResultFailure,
  type AnzenResultSuccess,
  Result,
} from '../anzen.js';
import type { Equal, Expect } from './utils/types.js';

function getRandomRes() {
  return Math.random() > 0.5
    ? Result.success(1)
    : Result.failure('a');
}

describe('Result', () => {
  describe('success', () => {
    it('should return expected value', () => {
      const res = Result.success(1);
      assert.equal(res.isSuccess, true);
      assert.equal(res.isFailure, false);
      type check = Expect<
        Equal<typeof res, AnzenResultSuccess<number>>
      >;
    });
  });

  describe('failure', () => {
    it('should return expected value', () => {
      const res = Result.failure(1);
      assert.equal(res.isSuccess, false);
      assert.equal(res.isFailure, true);
      type check = Expect<
        Equal<typeof res, AnzenResultFailure<number>>
      >;
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
      const successRes = Result.success(1);
      assert.throws(() => successRes.getError(), {
        message: 'Cannot get the error of a success.',
      });
      const failureRes = Result.failure(1);
      assert.equal(failureRes.getError(), 1);
    });
  });

  describe('chain', () => {
    it('should return expected value', () => {
      const successRes = Result.success(1);
      assert.deepEqual(
        successRes.chain((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return Result.success(x + 1);
        }),
        Result.success(2),
      );
      const failureRes = Result.failure(1);
      assert.equal(
        failureRes.chain((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return Result.success(x + 1);
        }),
        failureRes,
      );
    });
  });

  describe('elseChain', () => {
    it('should return expected value', () => {
      const successRes = Result.success(1);
      assert.deepEqual(
        successRes.elseChain((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return Result.success(x + 1);
        }),
        successRes,
      );
      const failureRes = Result.failure(1);
      assert.deepEqual(
        failureRes.elseChain((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return Result.success(x + 1);
        }),
        Result.success(2),
      );
    });
  });

  describe('chainElseChain', () => {
    it('should return expected value', () => {
      const successRes = Result.success(1);
      assert.deepEqual(
        successRes
          .chain(() => Result.success('a'))
          .elseChain((x) => {
            type check = Expect<Equal<typeof x, string>>;
            return Result.success(2);
          }),
        Result.success('a'),
      );
      const failureRes = Result.failure(1);
      assert.deepEqual(
        failureRes
          .chain(() => Result.success('a'))
          .elseChain((x) => {
            type check = Expect<Equal<typeof x, number>>;
            return Result.success(2);
          }),
        Result.success(2),
      );
      const randomRes = getRandomRes()
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
          typeof randomRes,
          | AnzenResultFailure<number>
          | AnzenResultSuccess<string>
        >
      >;
    });
  });

  describe('map', () => {
    it('should return expected value', () => {
      const successRes = Result.success(1);
      assert.deepEqual(
        successRes.map((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return x + 1;
        }),
        Result.success(2),
      );
      const failureRes = Result.failure(1);
      assert.equal(
        failureRes.map((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return x + 1;
        }),
        failureRes,
      );
    });
  });

  describe('elseMap', () => {
    it('should return expected value', () => {
      const successRes = Result.success(1);
      assert.equal(
        successRes.elseMap((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return x + 1;
        }),
        successRes,
      );
      const failureRes = Result.failure(1);
      assert.deepEqual(
        failureRes.elseMap((x) => {
          type check = Expect<Equal<typeof x, number>>;
          return x + 1;
        }),
        Result.success(2),
      );
    });
  });

  describe('mapElseMap', () => {
    it('should return expected value', () => {
      const successRes = Result.success(1);
      assert.deepEqual(
        successRes
          .map(() => 'b')
          .elseMap((x) => {
            type check = Expect<Equal<typeof x, string>>;
            return 2;
          }),
        Result.success('b'),
      );
      const failureRes = Result.failure(1);
      assert.deepEqual(
        failureRes
          .map(() => 'a')
          .elseMap((x) => {
            type check = Expect<Equal<typeof x, number>>;
            return 2;
          }),
        Result.success(2),
      );
      const randomRes = getRandomRes()
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
          typeof randomRes,
          | AnzenResultSuccess<number>
          | AnzenResultSuccess<string>
        >
      >;
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
      assert.deepEqual(success, [Result.success(1), 1]);
      type check = Expect<
        Equal<
          typeof success,
          [AnzenResultSuccess<number>, number]
        >
      >;
      const failure = Result.failure(1).unwrap();
      assert.deepEqual(failure, [
        Result.failure(1),
        undefined,
      ]);
      type check2 = Expect<
        Equal<
          typeof failure,
          [AnzenResultFailure<number>, undefined]
        >
      >;
      const failureWithDefault =
        Result.failure(1).unwrap(2);
      assert.deepEqual(failureWithDefault, [
        Result.failure(1),
        2,
      ]);
      type check3 = Expect<
        Equal<
          typeof failureWithDefault,
          [AnzenResultFailure<number>, number]
        >
      >;
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
      type check = Expect<
        Equal<
          typeof res,
          AnzenResultSuccess<[number, number, string]>
        >
      >;
    });

    it('when promises are resolved with failure, should return expected value', async () => {
      const promise1 = Promise.resolve(Result.failure(2));
      const res = await Result.promiseAll([promise1]);
      assert.equal(res.isSuccess, false);
      assert.equal(res.isFailure, true);
      assert.equal(res.getError(), 2);
      type check = Expect<
        Equal<typeof res, AnzenResultFailure<number>>
      >;
    });
  });

  describe('Result.unwrapPromiseAll', () => {
    it('when all promises are resolved with success, should return expected value', async () => {
      const promise1 = Promise.resolve(Result.success(1));
      const promise2 = Promise.resolve(Result.success(2));
      const promise3 = Promise.resolve(Result.success('A'));
      const res = await Result.unwrapPromiseAll([
        [],
        promise1,
        promise2,
        promise3,
      ]);
      assert.equal(res, [res, 1, 2, 'A']);
      type check = Expect<
        Equal<
          typeof res,
          [
            AnzenResultSuccess<[number, number, string]>,
            number,
            number,
            string,
          ]
        >
      >;
    });

    it('when promises are resolved with failure, should return expected value', async () => {
      const promise1 = Promise.resolve(Result.failure(2));
      const res = await Result.unwrapPromiseAll([
        [],
        promise1,
      ]);
      assert.deepEqual(res, [res]);
      type check = Expect<
        Equal<typeof res, [AnzenResultFailure<number>]>
      >;
    });
  });

  describe('Result.unwrap', () => {
    it('should return expected value', async () => {
      const successRes = Result.success(1);
      const failureRes = Result.failure(1);
      const fn = async () => successRes;
      const res = await fn().then(Result.unwrap());
      assert.deepEqual(res, [successRes, 1]);
      type chack = Expect<
        Equal<
          typeof res,
          [AnzenResultSuccess<number>, number]
        >
      >;
      const fn2 = async () => failureRes;
      const result2 = await fn2().then(Result.unwrap());
      assert.deepEqual(result2, [failureRes, undefined]);
      type check2 = Expect<
        Equal<
          typeof result2,
          [AnzenResultFailure<number>, undefined]
        >
      >;
      const result3 = await fn2().then(Result.unwrap(1));
      assert.deepEqual(result3, [failureRes, 1]);
      type check3 = Expect<
        Equal<
          typeof result3,
          [AnzenResultFailure<number>, number]
        >
      >;
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
            err instanceof Error
              ? err.message
              : String(err),
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
