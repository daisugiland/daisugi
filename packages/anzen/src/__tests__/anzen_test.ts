import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  Result,
  ResultFailure,
  ResultSuccess,
} from '../anzen.js';

describe('Result', () => {
  describe('success', () => {
    it(
      'should return expected value',
      () => {
        const result = Result.success(1);
        assert.equal(result.isSuccess, true);
        assert.equal(result.isFailure, false);
        assert.equal(typeof result.getValue, 'function');
        assert.equal(typeof result.getError, 'function');
        assert.equal(typeof result.chain, 'function');
        assert.equal(typeof result.elseChain, 'function');
        assert.equal(typeof result.map, 'function');
        assert.equal(typeof result.elseMap, 'function');
        assert.equal(
          typeof result.unsafeUnwrap,
          'function',
        );
        assert.equal(typeof result.toJSON, 'function');
        assert.equal(result.getValue(), 1);
        assert.throws(() => result.getError(), {
          message: 'Cannot get the err of success.',
        });
        assert.equal(
          result.chain((x) => x + 1),
          2,
        );
        assert.equal(
          result.elseChain((x) => x + 1).getValue(),
          1,
        );
        assert.equal(
          result.map((x) => x + 1).getValue(),
          2,
        );
        assert.equal(
          result.elseMap((x) => x + 1).getValue(),
          1,
        );
        assert.equal(result.unsafeUnwrap(), 1);
        assert.equal(
          result.toJSON(),
          JSON.stringify({ value: 1, isSuccess: true }),
        );
      },
    );
  });

  describe('failure', () => {
    it(
      'should return expected value',
      () => {
        const result = Result.failure(1);
        assert.equal(result.isSuccess, false);
        assert.equal(result.isFailure, true);
        assert.equal(typeof result.getValue, 'function');
        assert.equal(typeof result.getError, 'function');
        assert.equal(typeof result.chain, 'function');
        assert.equal(typeof result.elseChain, 'function');
        assert.equal(typeof result.map, 'function');
        assert.equal(typeof result.elseMap, 'function');
        assert.equal(
          typeof result.unsafeUnwrap,
          'function',
        );
        assert.equal(typeof result.toJSON, 'function');
        assert.equal(result.getError(), 1);
        assert.throws(() => result.getValue(), {
          message: 'Cannot get the value of failure.',
        });
        assert.equal(
          result.chain((x) => x + 1).getError(),
          1,
        );
        assert.equal(
          result.elseChain((x) => x + 1),
          2,
        );
        assert.equal(
          result.map((x) => x + 1).getError(),
          1,
        );
        assert.equal(
          result.elseMap((x) => x + 1).getValue(),
          2,
        );
        assert.equal(result.unsafeUnwrap(), 1);
        assert.equal(
          result.toJSON(),
          JSON.stringify({ error: 1, isSuccess: false }),
        );
      },
    );
  });

  describe('fromJSON', () => {
    it(
      'should return expected value',
      () => {
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
      },
    );
  });

  describe('promiseAll', () => {
    it(
      'when all promises are resolved with success, should return expected value',
      async () => {
        const promise1 = Promise.resolve(Result.success(1));
        const promise2 = Promise.resolve(Result.success(2));
        const result = await Result.promiseAll([
          promise1,
          promise2,
        ]);
        assert.equal(result.isSuccess, true);
        assert.equal(result.isFailure, false);
        assert.deepEqual(result.getValue(), [1, 2]);
      },
    );

    it(
      'when promises are resolved with failure, should return expected value',
      async () => {
        const promise1 = Promise.resolve(Result.success(1));
        const promise2 = Promise.resolve(Result.failure(2));
        const result = await Result.promiseAll([
          promise1,
          promise2,
        ]);
        assert.equal(result.isSuccess, false);
        assert.equal(result.isFailure, true);
        assert.equal(result.getError(), 2);
      },
    );

    it(
      'when promise is rejected with success, should return expected value',
      async () => {
        const err = new Error('err');
        const promise = Promise.reject(err);
        const result = await Result.promiseAll([promise]);
        assert.equal(result.isSuccess, false);
        assert.equal(result.isFailure, true);
        assert.equal(result.getError(), err);
      },
    );
  });
});
