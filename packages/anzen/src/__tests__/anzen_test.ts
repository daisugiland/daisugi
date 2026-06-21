import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  type AnzenAnyResult,
  type AnzenResultFailure,
  type AnzenResultSuccess,
  failure,
  fromJSON,
  fromSyncThrowable,
  fromThrowable,
  isAnzenResult,
  promiseAll,
  success,
  toTuple,
  unwrapPromiseAll,
} from '../anzen.js';
import { type Equal, checkType } from './utils/types.js';

function getRandomRes() {
  return Math.random() > 0.5 ? success(1) : failure('a');
}

describe('Result', () => {
  describe('success', () => {
    it('should return expected value', () => {
      const res = success(1);
      assert.deepEqual(res, success(12));
      assert.equal(res.isSuccess, true);
      assert.equal(res.isFailure, false);
      checkType<
        Equal<typeof res, AnzenResultSuccess<number>>
      >();
    });
  });

  describe('failure', () => {
    it('should return expected value', () => {
      const res = failure(1);
      assert.deepEqual(res, failure(12));
      assert.notDeepEqual(res, success(1));
      assert.equal(res.isSuccess, false);
      assert.equal(res.isFailure, true);
      checkType<
        Equal<typeof res, AnzenResultFailure<number>>
      >();
    });
  });

  describe('isAnzenResult', () => {
    it('should narrow Results and reject non-Results', () => {
      assert.equal(isAnzenResult(success(1)), true);
      assert.equal(isAnzenResult(failure(1)), true);
      assert.equal(isAnzenResult(fromJSON(success(1).toJSON())), true);
      assert.equal(isAnzenResult(null), false);
      assert.equal(isAnzenResult(undefined), false);
      assert.equal(isAnzenResult({ isSuccess: true }), false);
      assert.equal(isAnzenResult('success'), false);
      const value: unknown = success(1);
      if (isAnzenResult(value)) {
        checkType<
          Equal<
            typeof value,
            AnzenResultSuccess<unknown> | AnzenResultFailure<unknown>
          >
        >();
      }
    });
  });

  describe('unwrap', () => {
    it('should return expected value', () => {
      const successRes = success(1);
      assert.equal(successRes.unwrap(), 1);
      const failureRes = failure(1);
      assert.throws(() => failureRes.unwrap(), {
        message: 'Cannot get the value of a failure.',
      });
    });
  });

  describe('unwrapErr', () => {
    it('should return expected value', () => {
      const successRes = success(1) as AnzenAnyResult<
        string,
        number
      >;
      assert.throws(
        () => {
          const a = successRes.unwrapErr();
          const b = successRes.unwrap();
          // The throwing branch is typed `never`, so union access
          // stays clean: unwrapErr() -> E, unwrap() -> T.
          checkType<
            Equal<typeof a, string>,
            Equal<typeof b, number>
          >();
        },
        { message: 'Cannot get the error of a success.' },
      );
      const failureRes = failure(1);
      assert.equal(failureRes.unwrapErr(), 1);
    });
  });

  describe('andThen', () => {
    it('should return expected value', () => {
      assert.equal(
        success(1)
          .andThen((x) => {
            checkType<Equal<typeof x, number>>();
            return success(x + 1);
          })
          .unwrap(),
        2,
      );
      assert.equal(
        failure(1)
          .andThen((x) => {
            checkType<Equal<typeof x, number>>();
            return success(x + 1);
          })
          .unwrapErr(),
        1,
      );
    });
  });

  describe('orElse', () => {
    it('should return expected value', () => {
      assert.equal(
        success(1)
          .orElse((x) => {
            checkType<Equal<typeof x, number>>();
            return success(x + 1);
          })
          .unwrap(),
        1,
      );
      const failureRes = failure(1);
      assert.equal(
        failureRes
          .orElse((x) => {
            checkType<Equal<typeof x, number>>();
            return success(x + 1);
          })
          .unwrap(),
        2,
      );
    });
  });

  describe('chainElseChain', () => {
    it('should return expected value', () => {
      assert.equal(
        success(1)
          .andThen(() => success('a'))
          .orElse((x) => {
            checkType<Equal<typeof x, string>>();
            return success(2);
          })
          .unwrap(),
        'a',
      );
      assert.equal(
        failure(1)
          .andThen(() => success('a'))
          .orElse((x) => {
            checkType<Equal<typeof x, number>>();
            return success(2);
          })
          .unwrap(),
        2,
      );
      const randomRes = getRandomRes()
        .andThen((x) => {
          checkType<Equal<typeof x, number | string>>();
          return success('a');
        })
        .orElse((x) => {
          checkType<Equal<typeof x, string>>();
          return failure(2);
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
        success(1)
          .map((x) => {
            checkType<Equal<typeof x, number>>();
            return x + 1;
          })
          .unwrap(),
        2,
      );
      assert.equal(
        failure(1)
          .map((x) => {
            checkType<Equal<typeof x, number>>();
            return x + 1;
          })
          .unwrapErr(),
        1,
      );
    });
  });

  describe('mapErr', () => {
    it('should return expected value', () => {
      assert.equal(
        success(1)
          .mapErr((x) => {
            checkType<Equal<typeof x, number>>();
            return x + 1;
          })
          .unwrap(),
        1,
      );
      assert.equal(
        failure(1)
          .mapErr((x) => {
            checkType<Equal<typeof x, number>>();
            return x + 1;
          })
          .unwrap(),
        2,
      );
    });
  });

  describe('mapMapErr', () => {
    it('should return expected value', () => {
      assert.equal(
        success(1)
          .map(() => 'b')
          .mapErr((x) => {
            checkType<Equal<typeof x, string>>();
            return 2;
          })
          .unwrap(),
        'b',
      );
      assert.equal(
        failure(1)
          .map(() => 'a')
          .mapErr((x) => {
            checkType<Equal<typeof x, number>>();
            return 2;
          })
          .unwrap(),
        2,
      );
      const randomRes = getRandomRes()
        .map((x) => {
          checkType<Equal<typeof x, number | string>>();
          return 'a';
        })
        .mapErr((x) => {
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

  describe('unwrapOr', () => {
    it('should return expected value', () => {
      const successRes = success(1);
      assert.equal(successRes.unwrapOr(2), 1);
      const failureRes = failure(1);
      assert.equal(failureRes.unwrapOr(2), 2);
    });
  });

  describe('toTuple', () => {
    it('should return expected value', () => {
      const successPair = success(1).toTuple();
      assert.equal(successPair[0].unwrap(), 1);
      assert.equal(successPair[1], 1);
      checkType<
        Equal<
          typeof successPair,
          [AnzenResultSuccess<number>, number]
        >
      >();
      const failurePair = failure(1).toTuple();
      assert.equal(failurePair[0].unwrapErr(), 1);
      assert.equal(failurePair[1], undefined);
      checkType<
        Equal<
          typeof failurePair,
          [AnzenResultFailure<number>, undefined]
        >
      >();
      const failureWithDefault = failure(1).toTuple(2);
      assert.equal(failureWithDefault[0].unwrapErr(), 1);
      assert.equal(failureWithDefault[1], 2);
      checkType<
        Equal<
          typeof failureWithDefault,
          [AnzenResultFailure<number>, number]
        >
      >();
    });
  });

  describe('getRaw', () => {
    it('should return expected value', () => {
      const successRes = success(1);
      assert.equal(successRes.getRaw(), 1);
      const failureRes = failure(1);
      assert.equal(failureRes.getRaw(), 1);
    });
  });

  describe('toJSON', () => {
    it('should return expected value', () => {
      const successRes = success(1);
      assert.deepEqual(
        successRes.toJSON(),
        JSON.stringify({ value: 1, isSuccess: true }),
      );
      const failureRes = failure(1);
      assert.deepEqual(
        failureRes.toJSON(),
        JSON.stringify({ error: 1, isSuccess: false }),
      );
    });
  });

  describe('fromJSON', () => {
    it('should return expected value', () => {
      const successRes = fromJSON(
        JSON.stringify({ value: 1, isSuccess: true }),
      );
      assert.equal(successRes.isSuccess, true);
      assert.equal(successRes.isFailure, false);
      assert.equal(successRes.unwrap(), 1);
      const failureRes = fromJSON(
        JSON.stringify({
          error: 1,
          isSuccess: false,
        }),
      );
      assert.equal(failureRes.isSuccess, false);
      assert.equal(failureRes.isFailure, true);
      assert.equal(failureRes.unwrapErr(), 1);
    });

    it('types the result from its generic arguments', () => {
      // No generics: both sides default to unknown.
      const res = fromJSON(
        JSON.stringify({ value: 1, isSuccess: true }),
      );
      checkType<
        Equal<typeof res, AnzenAnyResult<unknown, unknown>>
      >();
      // Error-first generics, consistent with AnzenAnyResult<E, T>.
      const typed = fromJSON<string, number>(
        JSON.stringify({ value: 1, isSuccess: true }),
      );
      checkType<
        Equal<typeof typed, AnzenAnyResult<string, number>>
      >();
    });
  });

  describe('promiseAll', () => {
    it('when all promises are resolved with success, should return expected value', async () => {
      const promise1 = Promise.resolve(success(1));
      const promise2 = async () => success(2);
      const promise3 = () => success('A');
      const res = await promiseAll([
        promise1,
        promise2(),
        promise3(),
      ]);
      assert.equal(res.isSuccess, true);
      assert.equal(res.isFailure, false);
      assert.deepEqual(res.unwrap(), [1, 2, 'A']);
      checkType<
        Equal<
          typeof res,
          AnzenResultSuccess<[number, number, string]>
        >
      >();
      const res2 = await promiseAll([
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
      const promise1 = Promise.resolve(failure(2));
      const res = await promiseAll([promise1]);
      assert.equal(res.isSuccess, false);
      assert.equal(res.isFailure, true);
      assert.equal(res.unwrapErr(), 2);
      checkType<
        Equal<typeof res, AnzenResultFailure<number>>
      >();
    });

    it('all-success inputs yield a never failure branch (no narrowing)', async () => {
      const res = await promiseAll([
        success(1),
        Promise.resolve(success('a')),
      ]);
      checkType<
        Equal<
          typeof res,
          | AnzenResultSuccess<[number, string]>
          | AnzenResultFailure<never>
        >
      >();
    });
  });

  describe('unwrapPromiseAll', () => {
    it('when all promises are resolved with success, should return expected value', async () => {
      const promise1 = Promise.resolve(success(1));
      const promise2 = Promise.resolve(success(2));
      const promise3 = Promise.resolve(success('A'));
      const [res, ...results] = await unwrapPromiseAll([
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
      const promise1 = Promise.resolve(failure(2));
      const [res, ...results] = await unwrapPromiseAll([
        [],
        promise1,
      ]);
      assert.equal(res.isSuccess, false);
      assert.equal(res.isFailure, true);
      assert.deepEqual(results, []);
      checkType<
        Equal<typeof res, AnzenResultFailure<number>>
      >();
    });

    it('when inputs may fail, res should be typed as a success-or-failure union', async () => {
      const promise1 = Promise.resolve(success(1));
      const promise2 = async () => success(2);
      const promise3 = () => success('A');
      const [res, ...results] = await unwrapPromiseAll([
        [0, 0, '', 0],
        promise1,
        promise2(),
        promise3(),
        getRandomRes(),
      ]);
      checkType<
        Equal<
          typeof res,
          | AnzenResultFailure<string>
          | AnzenResultSuccess<
              [number, number, string, number]
            >
        >,
        Equal<
          typeof results,
          [number, number, string, number]
        >
      >();
    });

    it('when any input fails, returns the provided defaults as values', async () => {
      const ok = async (): Promise<
        AnzenAnyResult<string, number>
      > => success(1);
      const bad = async (): Promise<
        AnzenAnyResult<string, number>
      > => failure('boom');
      const [res, ...results] = await unwrapPromiseAll([
        [10, 20],
        ok(),
        bad(),
      ]);
      // Assert the type before any narrowing access to `res`.
      checkType<
        Equal<
          typeof res,
          | AnzenResultFailure<string>
          | AnzenResultSuccess<[number, number]>
        >,
        Equal<typeof results, [number, number]>
      >();
      assert.equal(res.isFailure, true);
      if (res.isFailure) {
        assert.equal(res.unwrapErr(), 'boom');
      }
      assert.deepEqual(results, [10, 20]);
    });

    it('defaults are type-checked against the success value types', async () => {
      const promise1 = Promise.resolve(success(1));
      // No defaults is allowed.
      await unwrapPromiseAll([[], promise1]);
      // A matching default is allowed.
      await unwrapPromiseAll([[0], promise1]);
      await unwrapPromiseAll([
        // @ts-expect-error default must match the success value type.
        ['not a number'],
        promise1,
      ]);
    });
  });

  describe('toTuple', () => {
    it('should return expected value', async () => {
      const successRes = success(1);
      const failureRes = failure(1);
      const fn = async () => successRes;
      const res = await fn().then(toTuple());
      assert.deepEqual(res, [successRes, 1]);
      checkType<
        Equal<
          typeof res,
          [AnzenResultSuccess<number>, number]
        >
      >();
      const fn2 = async () => failureRes;
      const result2 = await fn2().then(toTuple());
      assert.deepEqual(result2, [failureRes, undefined]);
      checkType<
        Equal<
          typeof result2,
          [AnzenResultFailure<number>, undefined]
        >
      >();
      const result3 = await fn2().then(toTuple(1));
      assert.deepEqual(result3, [failureRes, 1]);
      checkType<
        Equal<
          typeof result3,
          [AnzenResultFailure<number>, number]
        >
      >();
    });

    it('infers the success-or-failure tuple union without narrowing', async () => {
      const fn = async (): Promise<
        AnzenAnyResult<'err', number>
      > => success(1);
      // Assert the type before any narrowing access.
      const res = await fn().then(toTuple());
      checkType<
        Equal<
          typeof res,
          | [AnzenResultFailure<'err'>, undefined]
          | [AnzenResultSuccess<number>, number]
        >
      >();
      // With a default, the failure value takes the default type.
      const res2 = await fn().then(toTuple('fallback'));
      checkType<
        Equal<
          typeof res2,
          | [AnzenResultFailure<'err'>, string]
          | [AnzenResultSuccess<number>, number]
        >
      >();
    });

    it('uses never for the impossible branch of a single-variant input', async () => {
      // A statically-success input cannot fail: error type is never.
      const ok = await (async () => success(1))().then(
        toTuple(),
      );
      checkType<
        Equal<
          typeof ok,
          | [AnzenResultFailure<never>, undefined]
          | [AnzenResultSuccess<number>, number]
        >
      >();
      // A statically-failure input cannot succeed: value type is never.
      const bad = await (async () => failure('e'))().then(
        toTuple(),
      );
      checkType<
        Equal<
          typeof bad,
          | [AnzenResultFailure<string>, undefined]
          | [AnzenResultSuccess<never>, never]
        >
      >();
    });
  });

  describe('fromThrowable', () => {
    it('when throwable is thrown, should return expected value', () => {
      // Error-first generics let you name only the error type.
      const res = fromSyncThrowable<Error>(() => {
        throw new Error('err');
      });
      checkType<
        Equal<typeof res, AnzenAnyResult<Error, unknown>>
      >();
      assert.equal(res.isSuccess, false);
      assert.equal(res.isFailure, true);
      if (res.isFailure) {
        assert.equal(res.unwrapErr().message, 'err');
      }
    });

    it('when throwable is not thrown, should return expected value', () => {
      const res = fromSyncThrowable(() => 1);
      // No parseErr: value is inferred, error defaults to unknown.
      checkType<
        Equal<typeof res, AnzenAnyResult<unknown, number>>
      >();
      assert.equal(res.isSuccess, true);
      assert.equal(res.isFailure, false);
      assert.equal(res.unwrap(), 1);
    });

    describe('parseError is provided', () => {
      it('when throwable is thrown, should return expected value', () => {
        const res = fromSyncThrowable(
          () => {
            throw new Error('err');
          },
          (err) =>
            err instanceof Error
              ? err.message
              : String(err),
        );
        // Error type is inferred from parseErr's return type.
        checkType<
          Equal<typeof res, AnzenAnyResult<string, never>>
        >();
        assert.equal(res.isSuccess, false);
        assert.equal(res.isFailure, true);
        if (res.isFailure) {
          assert.equal(res.unwrapErr(), 'err');
        }
      });
    });

    describe('async', () => {
      it('when throwable is thrown, should return expected value', async () => {
        const res = await fromThrowable<Error>(async () => {
          throw new Error('err');
        });
        checkType<
          Equal<typeof res, AnzenAnyResult<Error, unknown>>
        >();
        assert.equal(res.isSuccess, false);
        assert.equal(res.isFailure, true);
        if (res.isFailure) {
          assert.equal(res.unwrapErr().message, 'err');
        }
      });
    });

    it('when throwable is not thrown, should return expected value', async () => {
      const res = await fromThrowable(async () => 1);
      checkType<
        Equal<typeof res, AnzenAnyResult<unknown, number>>
      >();
      assert.equal(res.isSuccess, true);
      assert.equal(res.isFailure, false);
      assert.equal(res.unwrap(), 1);
    });
  });
});
