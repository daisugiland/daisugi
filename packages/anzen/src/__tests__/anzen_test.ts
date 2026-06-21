import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  type AnzenAnyResult,
  type AnzenResultErr,
  type AnzenResultOk,
  AsyncResult,
  err,
  errAsync,
  fromJSON,
  fromPromise,
  fromSafePromise,
  fromSyncThrowable,
  fromThrowable,
  isAnzenResult,
  okAsync,
  promiseAll,
  ok,
  toTuple,
  unwrapPromiseAll,
} from '../anzen.js';
import { type Equal, checkType } from './utils/types.js';

function getRandomRes() {
  return Math.random() > 0.5 ? ok(1) : err('a');
}

describe('Result', () => {
  describe('ok', () => {
    it('should return expected value', () => {
      const res = ok(1);
      assert.deepEqual(res, ok(12));
      assert.equal(res.isOk, true);
      assert.equal(res.isErr, false);
      checkType<Equal<typeof res, AnzenResultOk<number>>>();
    });
  });

  describe('err', () => {
    it('should return expected value', () => {
      const res = err(1);
      assert.deepEqual(res, err(12));
      assert.notDeepEqual(res, ok(1));
      assert.equal(res.isOk, false);
      assert.equal(res.isErr, true);
      checkType<
        Equal<typeof res, AnzenResultErr<number>>
      >();
    });
  });

  describe('isAnzenResult', () => {
    it('should narrow Results and reject non-Results', () => {
      assert.equal(isAnzenResult(ok(1)), true);
      assert.equal(isAnzenResult(err(1)), true);
      assert.equal(
        isAnzenResult(fromJSON(ok(1).toJSON())),
        true,
      );
      assert.equal(isAnzenResult(null), false);
      assert.equal(isAnzenResult({ isOk: true }), false);
      assert.equal(isAnzenResult('ok'), false);
      const value: unknown = ok(1);
      if (isAnzenResult(value)) {
        checkType<
          Equal<
            typeof value,
            AnzenResultOk<unknown> | AnzenResultErr<unknown>
          >
        >();
      }
    });
  });

  describe('unwrap', () => {
    it('should return expected value', () => {
      const okRes = ok(1);
      assert.equal(okRes.unwrap(), 1);
      const errRes = err(1);
      assert.throws(() => errRes.unwrap(), {
        message: 'Cannot get the value of an Err result.',
      });
    });
  });

  describe('unwrapErr', () => {
    it('should return expected value', () => {
      const okRes = ok(1) as AnzenAnyResult<string, number>;
      assert.throws(
        () => {
          const a = okRes.unwrapErr();
          const b = okRes.unwrap();
          // The throwing branch is typed `never`, so union access
          // stays clean: unwrapErr() -> E, unwrap() -> T.
          checkType<
            Equal<typeof a, string>,
            Equal<typeof b, number>
          >();
        },
        {
          message: 'Cannot get the error of an Ok result.',
        },
      );
      const errRes = err(1);
      assert.equal(errRes.unwrapErr(), 1);
    });
  });

  describe('andThen', () => {
    it('should return expected value', () => {
      assert.equal(
        ok(1)
          .andThen((x) => {
            checkType<Equal<typeof x, number>>();
            return ok(x + 1);
          })
          .unwrap(),
        2,
      );
      assert.equal(
        err(1)
          .andThen((x) => {
            checkType<Equal<typeof x, number>>();
            return ok(x + 1);
          })
          .unwrapErr(),
        1,
      );
    });
  });

  describe('orElse', () => {
    it('should return expected value', () => {
      assert.equal(
        ok(1)
          .orElse((x) => {
            checkType<Equal<typeof x, number>>();
            return ok(x + 1);
          })
          .unwrap(),
        1,
      );
      const errRes = err(1);
      assert.equal(
        errRes
          .orElse((x) => {
            checkType<Equal<typeof x, number>>();
            return ok(x + 1);
          })
          .unwrap(),
        2,
      );
    });
  });

  describe('chainElseChain', () => {
    it('should return expected value', () => {
      assert.equal(
        ok(1)
          .andThen(() => ok('a'))
          .orElse((x) => {
            checkType<Equal<typeof x, string>>();
            return ok(2);
          })
          .unwrap(),
        'a',
      );
      assert.equal(
        err(1)
          .andThen(() => ok('a'))
          .orElse((x) => {
            checkType<Equal<typeof x, number>>();
            return ok(2);
          })
          .unwrap(),
        2,
      );
      const randomRes = getRandomRes()
        .andThen((x) => {
          checkType<Equal<typeof x, number | string>>();
          return ok('a');
        })
        .orElse((x) => {
          checkType<Equal<typeof x, string>>();
          return err(2);
        });
      checkType<
        Equal<
          typeof randomRes,
          AnzenResultErr<number> | AnzenResultOk<string>
        >
      >();
    });
  });

  describe('map', () => {
    it('should return expected value', () => {
      assert.equal(
        ok(1)
          .map((x) => {
            checkType<Equal<typeof x, number>>();
            return x + 1;
          })
          .unwrap(),
        2,
      );
      assert.equal(
        err(1)
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
        ok(1)
          .mapErr((x) => {
            checkType<Equal<typeof x, number>>();
            return x + 1;
          })
          .unwrap(),
        1,
      );
      assert.equal(
        err(1)
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
        ok(1)
          .map(() => 'b')
          .mapErr((x) => {
            checkType<Equal<typeof x, string>>();
            return 2;
          })
          .unwrap(),
        'b',
      );
      assert.equal(
        err(1)
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
          AnzenResultOk<number> | AnzenResultOk<string>
        >
      >();
    });
  });

  describe('unwrapOr', () => {
    it('should return expected value', () => {
      const okRes = ok(1);
      assert.equal(okRes.unwrapOr(2), 1);
      const errRes = err(1);
      assert.equal(errRes.unwrapOr(2), 2);
    });
  });

  describe('toTuple', () => {
    it('should return expected value', () => {
      const okPair = ok(1).toTuple();
      assert.equal(okPair[0].unwrap(), 1);
      assert.equal(okPair[1], 1);
      checkType<
        Equal<
          typeof okPair,
          [AnzenResultOk<number>, number]
        >
      >();
      const errPair = err(1).toTuple();
      assert.equal(errPair[0].unwrapErr(), 1);
      assert.equal(errPair[1], undefined);
      checkType<
        Equal<
          typeof errPair,
          [AnzenResultErr<number>, undefined]
        >
      >();
      const errWithDefault = err(1).toTuple(2);
      assert.equal(errWithDefault[0].unwrapErr(), 1);
      assert.equal(errWithDefault[1], 2);
      checkType<
        Equal<
          typeof errWithDefault,
          [AnzenResultErr<number>, number]
        >
      >();
    });
  });

  describe('getRaw', () => {
    it('should return expected value', () => {
      const okRes = ok(1);
      assert.equal(okRes.getRaw(), 1);
      const errRes = err(1);
      assert.equal(errRes.getRaw(), 1);
    });
  });

  describe('toJSON', () => {
    it('should return expected value', () => {
      const okRes = ok(1);
      assert.deepEqual(
        okRes.toJSON(),
        JSON.stringify({ value: 1, isOk: true }),
      );
      const errRes = err(1);
      assert.deepEqual(
        errRes.toJSON(),
        JSON.stringify({ error: 1, isOk: false }),
      );
    });
  });

  describe('fromJSON', () => {
    it('should return expected value', () => {
      const okRes = fromJSON(
        JSON.stringify({ value: 1, isOk: true }),
      );
      assert.equal(okRes.isOk, true);
      assert.equal(okRes.isErr, false);
      assert.equal(okRes.unwrap(), 1);
      const errRes = fromJSON(
        JSON.stringify({
          error: 1,
          isOk: false,
        }),
      );
      assert.equal(errRes.isOk, false);
      assert.equal(errRes.isErr, true);
      assert.equal(errRes.unwrapErr(), 1);
    });

    it('types the result from its generic arguments', () => {
      // No generics: both sides default to unknown.
      const res = fromJSON(
        JSON.stringify({ value: 1, isOk: true }),
      );
      checkType<
        Equal<typeof res, AnzenAnyResult<unknown, unknown>>
      >();
      // Error-first generics, consistent with AnzenAnyResult<E, T>.
      const typed = fromJSON<string, number>(
        JSON.stringify({ value: 1, isOk: true }),
      );
      checkType<
        Equal<typeof typed, AnzenAnyResult<string, number>>
      >();
    });
  });

  describe('promiseAll', () => {
    it('when all promises are resolved with success, should return expected value', async () => {
      const promise1 = Promise.resolve(ok(1));
      const promise2 = async () => ok(2);
      const promise3 = () => ok('A');
      const res = await promiseAll([
        promise1,
        promise2(),
        promise3(),
      ]);
      assert.equal(res.isOk, true);
      assert.equal(res.isErr, false);
      assert.deepEqual(res.unwrap(), [1, 2, 'A']);
      checkType<
        Equal<
          typeof res,
          AnzenResultOk<[number, number, string]>
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
          | AnzenResultErr<string>
          | AnzenResultOk<[number, number, string, number]>
        >
      >();
    });

    it('when promises are resolved with failure, should return expected value', async () => {
      const promise1 = Promise.resolve(err(2));
      const res = await promiseAll([promise1]);
      assert.equal(res.isOk, false);
      assert.equal(res.isErr, true);
      assert.equal(res.unwrapErr(), 2);
      checkType<
        Equal<typeof res, AnzenResultErr<number>>
      >();
    });

    it('all-success inputs yield a never failure branch (no narrowing)', async () => {
      const res = await promiseAll([
        ok(1),
        Promise.resolve(ok('a')),
      ]);
      checkType<
        Equal<
          typeof res,
          | AnzenResultOk<[number, string]>
          | AnzenResultErr<never>
        >
      >();
    });
  });

  describe('unwrapPromiseAll', () => {
    it('when all promises are resolved with success, should return expected value', async () => {
      const promise1 = Promise.resolve(ok(1));
      const promise2 = Promise.resolve(ok(2));
      const promise3 = Promise.resolve(ok('A'));
      const [res, ...results] = await unwrapPromiseAll([
        [],
        promise1,
        promise2,
        promise3,
      ]);
      if (res.isOk) {
        results;
      }
      assert.equal(res.isOk, true);
      assert.equal(res.isErr, false);
      assert.deepEqual(results, [1, 2, 'A']);
      checkType<
        Equal<
          typeof res,
          AnzenResultOk<[number, number, string]>
        >,
        Equal<typeof results, [number, number, string]>
      >();
    });

    it('when promises are resolved with failure, should return expected value', async () => {
      const promise1 = Promise.resolve(err(2));
      const [res, ...results] = await unwrapPromiseAll([
        [],
        promise1,
      ]);
      assert.equal(res.isOk, false);
      assert.equal(res.isErr, true);
      assert.deepEqual(results, []);
      checkType<
        Equal<typeof res, AnzenResultErr<number>>
      >();
    });

    it('when inputs may fail, res should be typed as a success-or-failure union', async () => {
      const promise1 = Promise.resolve(ok(1));
      const promise2 = async () => ok(2);
      const promise3 = () => ok('A');
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
          | AnzenResultErr<string>
          | AnzenResultOk<[number, number, string, number]>
        >,
        Equal<
          typeof results,
          [number, number, string, number]
        >
      >();
    });

    it('when any input fails, returns the provided defaults as values', async () => {
      const good = async (): Promise<
        AnzenAnyResult<string, number>
      > => ok(1);
      const bad = async (): Promise<
        AnzenAnyResult<string, number>
      > => err('boom');
      const [res, ...results] = await unwrapPromiseAll([
        [10, 20],
        good(),
        bad(),
      ]);
      // Assert the type before any narrowing access to `res`.
      checkType<
        Equal<
          typeof res,
          | AnzenResultErr<string>
          | AnzenResultOk<[number, number]>
        >,
        Equal<typeof results, [number, number]>
      >();
      assert.equal(res.isErr, true);
      if (res.isErr) {
        assert.equal(res.unwrapErr(), 'boom');
      }
      assert.deepEqual(results, [10, 20]);
    });

    it('defaults are type-checked against the success value types', async () => {
      const promise1 = Promise.resolve(ok(1));
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
      const okRes = ok(1);
      const errRes = err(1);
      const fn = async () => okRes;
      const res = await fn().then(toTuple());
      assert.deepEqual(res, [okRes, 1]);
      checkType<
        Equal<typeof res, [AnzenResultOk<number>, number]>
      >();
      const fn2 = async () => errRes;
      const result2 = await fn2().then(toTuple());
      assert.deepEqual(result2, [errRes, undefined]);
      checkType<
        Equal<
          typeof result2,
          [AnzenResultErr<number>, undefined]
        >
      >();
      const result3 = await fn2().then(toTuple(1));
      assert.deepEqual(result3, [errRes, 1]);
      checkType<
        Equal<
          typeof result3,
          [AnzenResultErr<number>, number]
        >
      >();
    });

    it('infers the success-or-failure tuple union without narrowing', async () => {
      const fn = async (): Promise<
        AnzenAnyResult<'err', number>
      > => ok(1);
      // Assert the type before any narrowing access.
      const res = await fn().then(toTuple());
      checkType<
        Equal<
          typeof res,
          | [AnzenResultErr<'err'>, undefined]
          | [AnzenResultOk<number>, number]
        >
      >();
      // With a default, the failure value takes the default type.
      const res2 = await fn().then(toTuple('fallback'));
      checkType<
        Equal<
          typeof res2,
          | [AnzenResultErr<'err'>, string]
          | [AnzenResultOk<number>, number]
        >
      >();
    });

    it('uses never for the impossible branch of a single-variant input', async () => {
      // A statically-success input cannot fail: error type is never.
      const good = await (async () => ok(1))().then(
        toTuple(),
      );
      checkType<
        Equal<
          typeof good,
          | [AnzenResultErr<never>, undefined]
          | [AnzenResultOk<number>, number]
        >
      >();
      // A statically-failure input cannot succeed: value type is never.
      const bad = await (async () => err('e'))().then(
        toTuple(),
      );
      checkType<
        Equal<
          typeof bad,
          | [AnzenResultErr<string>, undefined]
          | [AnzenResultOk<never>, never]
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
      assert.equal(res.isOk, false);
      assert.equal(res.isErr, true);
      if (res.isErr) {
        assert.equal(res.unwrapErr().message, 'err');
      }
    });

    it('when throwable is not thrown, should return expected value', () => {
      const res = fromSyncThrowable(() => 1);
      // No parseErr: value is inferred, error defaults to unknown.
      checkType<
        Equal<typeof res, AnzenAnyResult<unknown, number>>
      >();
      assert.equal(res.isOk, true);
      assert.equal(res.isErr, false);
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
        assert.equal(res.isOk, false);
        assert.equal(res.isErr, true);
        if (res.isErr) {
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
        assert.equal(res.isOk, false);
        assert.equal(res.isErr, true);
        if (res.isErr) {
          assert.equal(res.unwrapErr().message, 'err');
        }
      });
    });

    it('when throwable is not thrown, should return expected value', async () => {
      const res = await fromThrowable(async () => 1);
      checkType<
        Equal<typeof res, AnzenAnyResult<unknown, number>>
      >();
      assert.equal(res.isOk, true);
      assert.equal(res.isErr, false);
      assert.equal(res.unwrap(), 1);
    });
  });
});

describe('AsyncResult', () => {
  describe('okAsync / errAsync', () => {
    it('should build awaitable Results', async () => {
      const okRes = await okAsync(1);
      assert.equal(okRes.unwrap(), 1);
      const errRes = await errAsync('boom');
      assert.equal(errRes.unwrapErr(), 'boom');
      checkType<Equal<typeof okAsync, typeof okAsync>>();
    });
  });

  describe('then', () => {
    it('should be awaitable to the underlying Result', async () => {
      const res = await okAsync(1);
      checkType<
        Equal<typeof res, AnzenAnyResult<never, number>>
      >();
      assert.equal(res.isOk, true);
    });
  });

  describe('map', () => {
    it('should transform the Ok value with sync or async fn', async () => {
      const res = await okAsync(1)
        .map((x) => x + 1)
        .map(async (x) => x * 10);
      assert.equal(res.unwrap(), 20);
      const passthrough = await errAsync<string>(
        'boom',
      ).map((x: number) => x + 1);
      assert.equal(passthrough.unwrapErr(), 'boom');
    });
  });

  describe('mapErr', () => {
    it('should transform the Err value with sync or async fn', async () => {
      const res = await errAsync('boom').mapErr(
        async (e) => `${e}!`,
      );
      assert.equal(res.unwrapErr(), 'boom!');
      const passthrough = await okAsync(1).mapErr(
        (e: string) => `${e}!`,
      );
      assert.equal(passthrough.unwrap(), 1);
    });
  });

  describe('andThen', () => {
    it('should sequence Result / AsyncResult / Promise returns', async () => {
      const viaResult = await okAsync(1).andThen((x) =>
        ok(x + 1),
      );
      assert.equal(viaResult.unwrap(), 2);
      const viaAsync = await okAsync(1).andThen((x) =>
        okAsync(x + 2),
      );
      assert.equal(viaAsync.unwrap(), 3);
      const viaPromise = await okAsync(1).andThen((x) =>
        Promise.resolve(ok(x + 3)),
      );
      assert.equal(viaPromise.unwrap(), 4);
      const short = await errAsync<string>('boom').andThen(
        (x: number) => ok(x + 1),
      );
      assert.equal(short.unwrapErr(), 'boom');
    });

    it('should union the error type', async () => {
      const res = await okAsync<number>(1).andThen((x) =>
        x > 0 ? ok(x) : err('neg'),
      );
      checkType<
        Equal<typeof res, AnzenAnyResult<string, number>>
      >();
    });
  });

  describe('orElse', () => {
    it('should recover from an Err', async () => {
      const recovered = await errAsync('boom').orElse(() =>
        ok('foo'),
      );
      assert.equal(recovered.unwrap(), 'foo');
      const passthrough = await okAsync(1).orElse(() =>
        ok(2),
      );
      assert.equal(passthrough.unwrap(), 1);
    });
  });

  describe('unwrap / unwrapErr / unwrapOr', () => {
    it('should resolve the awaited terminals', async () => {
      assert.equal(await okAsync(1).unwrap(), 1);
      assert.equal(
        await errAsync('boom').unwrapErr(),
        'boom',
      );
      assert.equal(await errAsync('boom').unwrapOr(2), 2);
      assert.equal(await okAsync(1).unwrapOr(2), 1);
      await assert.rejects(
        () => errAsync('boom').unwrap(),
        {
          message: 'Cannot get the value of an Err result.',
        },
      );
    });
  });

  describe('fromPromise', () => {
    it('should wrap a resolved promise as Ok', async () => {
      const res = await fromPromise(Promise.resolve(1));
      assert.equal(res.unwrap(), 1);
    });

    it('should wrap a rejection as Err, typed unknown by default', async () => {
      const res = await fromPromise(
        Promise.reject(new Error('x')),
      );
      assert.equal(res.isErr, true);
      const error = res.unwrapErr();
      checkType<Equal<typeof error, unknown>>();
    });

    it('should map the rejection via parseErr', async () => {
      const res = await fromPromise(
        Promise.reject(new Error('x')),
        (e) => (e as Error).message,
      );
      assert.equal(res.unwrapErr(), 'x');
      const error = res.unwrapErr();
      checkType<Equal<typeof error, string>>();
    });
  });

  describe('fromSafePromise', () => {
    it('should lift a Promise<Result> into an AsyncResult', async () => {
      const asyncRes = fromSafePromise<string, number>(
        Promise.resolve(ok(1)),
      );
      checkType<
        Equal<typeof asyncRes, AsyncResult<string, number>>
      >();
      const res = await asyncRes.map((x) => x + 1);
      assert.equal(res.unwrap(), 2);
    });
  });
});
