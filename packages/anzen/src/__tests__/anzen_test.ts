import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  type AnzenResult,
  type AnzenResultErr,
  type AnzenResultOk,
  err,
  fromJSON,
  fromThrowable,
  fromAsyncThrowable,
  isAnzenResult,
  promiseAll,
  ok,
  safeTry,
  toTuple,
  promiseAllTuple,
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
      const okRes = ok(1) as AnzenResult<string, number>;
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
          [AnzenResultErr<number>, never]
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
        Equal<typeof res, AnzenResult<unknown, unknown>>
      >();
      // Error-first generics, consistent with AnzenResult<E, T>.
      const typed = fromJSON<string, number>(
        JSON.stringify({ value: 1, isOk: true }),
      );
      checkType<
        Equal<typeof typed, AnzenResult<string, number>>
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
      // All inputs are statically Ok, so there is no failure branch.
      checkType<
        Equal<
          typeof res,
          AnzenResultOk<[number, number, string]>
        >
      >();
      if (res.isOk) {
        assert.deepEqual(res.unwrap(), [1, 2, 'A']);
      }
    });

    it('when promises are resolved with failure, should return expected value', async () => {
      const promise1: Promise<AnzenResult<number, number>> =
        Promise.resolve(err(2));
      const res = await promiseAll([promise1]);
      assert.equal(res.isOk, false);
      assert.equal(res.isErr, true);
      assert.equal(res.unwrapErr(), 2);
    });

    it('types a raw (non-Result) rejection as unknown (B2)', async () => {
      const raw = Promise.reject(
        new Error('raw'),
      ) as Promise<AnzenResult<never, number>>;
      const res = await promiseAll([raw]);
      assert.equal(res.isErr, true);
      if (res.isErr) {
        const error = res.unwrapErr();
        // The caught value is not one of the wrapped Result failures,
        // so it is honestly typed `unknown`, not the declared error type.
        checkType<Equal<typeof error, unknown>>();
      }
    });

    it('the failure branch is always typed unknown', async () => {
      const res = await promiseAll([
        ok(1),
        Promise.resolve(ok('a')),
      ]);
      checkType<
        Equal<
          typeof res,
          | AnzenResultOk<[number, string]>
          | AnzenResultErr<unknown>
        >
      >();
    });
  });

  describe('promiseAllTuple', () => {
    it('when all promises are resolved with success, should return expected value', async () => {
      const promise1 = Promise.resolve(ok(1));
      const promise2 = Promise.resolve(ok(2));
      const promise3 = Promise.resolve(ok('A'));
      const [res, ...results] = await promiseAllTuple([
        [0, 0, ''],
        promise1,
        promise2,
        promise3,
      ]);
      assert.equal(res.isOk, true);
      assert.equal(res.isErr, false);
      assert.deepEqual(results, [1, 2, 'A']);
      // All inputs are statically Ok, so there is no failure branch.
      checkType<
        Equal<
          typeof res,
          AnzenResultOk<[number, number, string]>
        >,
        Equal<typeof results, [number, number, string]>
      >();
    });

    it('when an input fails, returns the provided defaults as values', async () => {
      const failing: Promise<AnzenResult<string, number>> =
        Promise.resolve(err('boom'));
      const [res, ...results] = await promiseAllTuple([
        [0],
        failing,
      ]);
      // Assert shape before any narrowing access to `res`.
      checkType<
        Equal<
          typeof res,
          AnzenResultErr<unknown> | AnzenResultOk<[number]>
        >,
        Equal<typeof results, [number]>
      >();
      assert.equal(res.isErr, true);
      if (res.isErr) {
        assert.equal(res.unwrapErr(), 'boom');
      }
      assert.deepEqual(results, [0]);
    });

    it('when inputs may fail, res should be typed as a success-or-failure union', async () => {
      const promise1 = Promise.resolve(ok(1));
      const promise2 = async () => ok(2);
      const promise3 = () => ok('A');
      const [res, ...results] = await promiseAllTuple([
        [0, 0, '', 0],
        promise1,
        promise2(),
        promise3(),
        getRandomRes(),
      ]);
      checkType<
        Equal<
          typeof res,
          | AnzenResultErr<unknown>
          | AnzenResultOk<[number, number, string, number]>
        >,
        Equal<
          typeof results,
          [number, number, string, number]
        >
      >();
    });

    it('requires a full-length defaults tuple (B1)', async () => {
      const promise1 = Promise.resolve(ok(1));
      const promise2 = Promise.resolve(ok(2));
      // A full, correctly-typed defaults tuple is allowed.
      await promiseAllTuple([[0, 0], promise1, promise2]);
      await promiseAllTuple([
        // @ts-expect-error short defaults are rejected: need 2, got 1.
        [0],
        promise1,
        promise2,
      ]);
      await promiseAllTuple([
        // @ts-expect-error empty defaults are rejected when results exist.
        [],
        promise1,
      ]);
      await promiseAllTuple([
        // @ts-expect-error default must match the success value type.
        ['not a number'],
        promise1,
      ]);
    });

    it('types a raw (non-Result) rejection as unknown (B2)', async () => {
      const raw = Promise.reject(
        new Error('raw'),
      ) as Promise<AnzenResult<never, number>>;
      const [res, ...results] = await promiseAllTuple([
        [0],
        raw,
      ]);
      checkType<
        Equal<
          typeof res,
          | AnzenResultErr<unknown>
          | AnzenResultOk<[number]>
        >,
        Equal<typeof results, [number]>
      >();
      assert.equal(res.isErr, true);
      if (res.isErr) {
        // After narrowing, unwrapErr() yields the raw caught value as unknown.
        checkType<Equal<typeof res, AnzenResultErr<unknown>>>();
      }
    });

    it('narrows to ok-only branch when all inputs are statically Ok', async () => {
      const [res, n, s] = await promiseAllTuple([
        [0, ''],
        ok(1),
        ok('a'),
      ]);
      checkType<
        Equal<
          typeof res,
          | AnzenResultErr<unknown>
          | AnzenResultOk<[number, string]>
        >
      >();
      checkType<Equal<typeof n, number>>();
      checkType<Equal<typeof s, string>>();
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
          [AnzenResultErr<number>, never]
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
        AnzenResult<'err', number>
      > => ok(1);
      // Assert the type before any narrowing access.
      const res = await fn().then(toTuple());
      checkType<
        Equal<
          typeof res,
          | [AnzenResultErr<'err'>, never]
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
          | [AnzenResultErr<never>, never]
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
          | [AnzenResultErr<string>, never]
          | [AnzenResultOk<never>, never]
        >
      >();
    });
  });

  describe('fromThrowable', () => {
    it('returns a function that wraps throws as Err', () => {
      const safe = fromThrowable(
        (id: number) => {
          if (id < 0) throw new Error('bad id');
          return id * 2;
        },
        (e) => (e instanceof Error ? e.message : String(e)),
      );
      checkType<
        Equal<
          typeof safe,
          (id: number) => AnzenResult<string, number>
        >
      >();
      assert.equal(safe(2).unwrap(), 4);
      const errRes = safe(-1);
      assert.equal(errRes.isErr, true);
      if (errRes.isErr) {
        assert.equal(errRes.unwrapErr(), 'bad id');
      }
    });

    it('error defaults to unknown when parseErr is omitted', () => {
      const safe = fromThrowable((x: number) => x + 1);
      checkType<
        Equal<
          typeof safe,
          (x: number) => AnzenResult<unknown, number>
        >
      >();
      assert.equal(safe(1).unwrap(), 2);
    });

    it('works with zero-argument functions', () => {
      const safe = fromThrowable(() => 42);
      assert.equal(safe().unwrap(), 42);
    });
  });

  describe('fromAsyncThrowable', () => {
    it('returns a function that wraps rejections as Err', async () => {
      const safe = fromAsyncThrowable(
        async (id: number) => {
          if (id < 0) throw new Error('bad id');
          return id * 2;
        },
        (e) => (e instanceof Error ? e.message : String(e)),
      );
      checkType<
        Equal<
          typeof safe,
          (
            id: number,
          ) => Promise<AnzenResult<string, number>>
        >
      >();
      assert.equal((await safe(2)).unwrap(), 4);
      const errRes = await safe(-1);
      assert.equal(errRes.isErr, true);
      if (errRes.isErr) {
        assert.equal(errRes.unwrapErr(), 'bad id');
      }
    });

    it('error defaults to unknown when parseErr is omitted', async () => {
      const safe = fromAsyncThrowable(
        async (x: number) => x + 1,
      );
      checkType<
        Equal<
          typeof safe,
          (
            x: number,
          ) => Promise<AnzenResult<unknown, number>>
        >
      >();
      assert.equal((await safe(1)).unwrap(), 2);
    });

    it('captures a synchronous throw on invocation', async () => {
      const safe = fromAsyncThrowable(
        (): Promise<number> => {
          throw new Error('sync boom');
        },
      );
      const res = await safe();
      assert.equal(res.isErr, true);
    });
  });
});

describe('safeTry', () => {
  describe('sync', () => {
    it('unwraps Ok values and returns the final Result', () => {
      const res = safeTry<string, number>(function* () {
        const a = yield* ok<number>(1);
        const b = yield* ok<number>(2);
        return ok(a + b);
      });
      checkType<
        Equal<typeof res, AnzenResult<string, number>>
      >();
      assert.equal(res.isOk, true);
      assert.equal(res.unwrap(), 3);
    });

    it('short-circuits on the first Err', () => {
      let reached = false;
      const res = safeTry<string, number>(function* () {
        const a = yield* ok<number>(1);
        yield* err<string>('boom');
        reached = true;
        return ok(a);
      });
      assert.equal(res.isErr, true);
      assert.equal(reached, false);
      if (res.isErr) {
        assert.equal(res.unwrapErr(), 'boom');
      }
    });

    it('unions the error types of every yielded Result', () => {
      const res = safeTry(function* () {
        const a = yield* ok(1) as AnzenResult<'a', number>;
        const b = yield* ok(2) as AnzenResult<'b', number>;
        return ok(a + b);
      });
      checkType<
        Equal<typeof res, AnzenResult<'a' | 'b', number>>
      >();
    });
  });

  describe('async', () => {
    it('unwraps Ok values across awaited steps', async () => {
      const find = async () => ok<number>(10);
      const res = await safeTry<string, number>(
        async function* () {
          const a = yield* await find();
          return ok(a * 2);
        },
      );
      checkType<
        Equal<typeof res, AnzenResult<string, number>>
      >();
      assert.equal(res.unwrap(), 20);
    });

    it('short-circuits on the first Err', async () => {
      let reached = false;
      const charge = async () => err<string>('declined');
      const res = await safeTry<string, number>(
        async function* () {
          const a = yield* await Promise.resolve(
            ok<number>(1),
          );
          yield* await charge();
          reached = true;
          return ok(a);
        },
      );
      assert.equal(res.isErr, true);
      assert.equal(reached, false);
      if (res.isErr) {
        assert.equal(res.unwrapErr(), 'declined');
      }
    });
  });
});
