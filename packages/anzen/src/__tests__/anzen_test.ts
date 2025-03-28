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
    });
  });

  describe('failure', () => {
    it('should return expected value', () => {
      const result = Result.failure(1);
      assert.equal(result.isSuccess, false);
      assert.equal(result.isFailure, true);
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
      assert.equal(
        resultSuccess.chain((x) => x + 1),
        2,
      );
      const resultFailure = Result.failure(1);
      assert.equal(
        resultFailure.chain((x) => x + 1),
        resultFailure,
      );
    });
  });

  describe('elseChain', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.success(1);
      assert.equal(
        resultSuccess.elseChain((x) => x + 1),
        resultSuccess,
      );
      const resultFailure = Result.failure(1);
      assert.equal(
        resultFailure.elseChain((x) => x + 1),
        2,
      );
    });
  });

  describe('map', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.success(1);
      assert.deepEqual(
        resultSuccess.map((x) => x + 1),
        Result.success(2),
      );
      const resultFailure = Result.failure(1);
      assert.equal(
        resultFailure.map((x) => x + 1),
        resultFailure,
      );
    });
  });

  describe('elseMap', () => {
    it('should return expected value', () => {
      const resultSuccess = Result.success(1);
      assert.equal(
        resultSuccess.elseMap((x) => x + 1),
        resultSuccess,
      );
      const resultFailure = Result.failure(1);
      assert.deepEqual(
        resultFailure.elseMap((x) => x + 1),
        Result.success(2),
      );
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
