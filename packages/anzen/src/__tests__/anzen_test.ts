import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  Result,
  ResultFailure,
  ResultSuccess,
} from '../anzen.js';

describe('Result', () => {
  describe('success', () => {
    it('should return expected value', () => {
      const result = Result.success(1);
      assert.equal(result.isSuccess, true);
      assert.equal(result.isFailure, false);
      assert.equal(typeof result.getValue, 'function');
      assert.equal(typeof result.getError, 'function');
      assert.equal(typeof result.unwrap, 'function');
      assert.equal(typeof result.chain, 'function');
      assert.equal(typeof result.elseChain, 'function');
      assert.equal(typeof result.map, 'function');
      assert.equal(typeof result.elseMap, 'function');
      assert.equal(typeof result.unsafeUnwrap, 'function');
      assert.equal(typeof result.toJSON, 'function');
      assert.equal(result.getValue(), 1);
      assert.throws(() => result.getError(), {
        message: 'Cannot get the error of a success.',
      });
      assert.equal(
        result.chain((x) => x + 1),
        2,
      );
      assert.equal(
        result.elseChain((x) => x + 1).getValue(),
        1,
      );
      assert.equal(result.map((x) => x + 1).getValue(), 2);
      assert.equal(
        result.elseMap((x) => x + 1).getValue(),
        1,
      );
      assert.equal(result.unsafeUnwrap(), 1);
      assert.equal(
        result.toJSON(),
        JSON.stringify({ value: 1, isSuccess: true }),
      );
      assert.equal(result.getOrElse(2), 1);
      assert.deepEqual(result.unwrap(), [result, 1]);
    });
  });

  describe('failure', () => {
    it('should return expected value', () => {
      const result = Result.failure(1);
      assert.equal(result.isSuccess, false);
      assert.equal(result.isFailure, true);
      assert.equal(typeof result.getValue, 'function');
      assert.equal(typeof result.getError, 'function');
      assert.equal(typeof result.chain, 'function');
      assert.equal(typeof result.elseChain, 'function');
      assert.equal(typeof result.map, 'function');
      assert.equal(typeof result.elseMap, 'function');
      assert.equal(typeof result.unsafeUnwrap, 'function');
      assert.equal(typeof result.toJSON, 'function');
      assert.equal(result.getError(), 1);
      assert.throws(() => result.getValue(), {
        message: 'Cannot get the value of a failure.',
      });
      assert.equal(
        result.chain((x) => x + 1).getError(),
        1,
      );
      assert.equal(
        result.elseChain((x) => x + 1),
        2,
      );
      assert.equal(result.map((x) => x + 1).getError(), 1);
      assert.equal(
        result.elseMap((x) => x + 1).getValue(),
        2,
      );
      assert.equal(result.unsafeUnwrap(), 1);
      assert.equal(
        result.toJSON(),
        JSON.stringify({ error: 1, isSuccess: false }),
      );
      assert.equal(result.getOrElse(2), 2);
      assert.deepEqual(result.unwrap(), [
        result,
        undefined,
      ]);
      assert.deepEqual(result.unwrap(1), [result, 1]);
    });
  });

  describe('fromJSON', () => {
    it('should return expected value', () => {
      let result = Result.fromJSON(
        JSON.stringify({ value: 1, isSuccess: true }),
      );
      assert.equal(result.isSuccess, true);
      assert.equal(result.isFailure, false);
      assert.equal(result.getValue(), 1);
      assert.equal(result instanceof ResultSuccess, true);
      result = Result.fromJSON(
        JSON.stringify({
          error: 1,
          isSuccess: false,
        }),
      );
      assert.equal(result.isSuccess, false);
      assert.equal(result.isFailure, true);
      assert.equal(result.getError(), 1);
      assert.equal(result instanceof ResultFailure, true);
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

  describe('promiseAll', () => {
    it('when all promises are resolved with success, should return expected value', async () => {
      const promise1 = Promise.resolve(Result.success(1));
      const promise2 = Promise.resolve(Result.success(2));
      const promise3 = Promise.resolve(Result.success('A'));
      const result = await Result.promiseAll([
        promise1,
        promise2,
        promise3,
      ]);
      assert.equal(result.isSuccess, true);
      assert.equal(result.isFailure, false);
      assert.deepEqual(result.getValue(), [1, 2, 'A']);
    });

    it('when promises are resolved with failure, should return expected value', async () => {
      const promise1 = Promise.resolve(Result.failure(2));
      const result = await Result.promiseAll([promise1]);
      assert.equal(result.isSuccess, false);
      assert.equal(result.isFailure, true);
      assert.equal(result.getError(), 2);
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
      const result = Result.fromSyncThrowable<
        Error,
        number
      >(() => 1);
      assert.equal(result.isSuccess, true);
      assert.equal(result.isFailure, false);
      assert.equal(result.getValue(), 1);
    });

    describe('parseError is provided', () => {
      it('when throwable is thrown, should return expected value', () => {
        const result = Result.fromSyncThrowable<
          Error,
          Error
        >(
          () => {
            throw new Error('err');
          },
          (err) => err.message,
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
      const result = await Result.fromThrowable<
        Error,
        number
      >(async () => 1);
      assert.equal(result.isSuccess, true);
      assert.equal(result.isFailure, false);
      assert.equal(result.getValue(), 1);
    });
  });
});
