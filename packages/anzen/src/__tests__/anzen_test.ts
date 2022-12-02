import assert from 'node:assert';
import test from 'node:test';

import {
  Result,
  ResultFailure,
  ResultSuccess,
} from '../anzen.js';

test('Result', async (t) => {
  await t.test('success', async (t) => {
    await t.test(
      'should return expected value',
      async () => {
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
          message: 'Cannot get the error of success.',
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

  await t.test('failure', async (t) => {
    await t.test(
      'should return expected value',
      async () => {
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

  await t.test('fromJSON', async (t) => {
    await t.test(
      'should return expected value',
      async () => {
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

  await t.test('promiseAll', async (t) => {
    await t.test(
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

    await t.test(
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

    await t.test(
      'when promise is rejected with success, should return expected value',
      async () => {
        const error = new Error('error');
        const promise = Promise.reject(error);
        const result = await Result.promiseAll([promise]);
        assert.equal(result.isSuccess, false);
        assert.equal(result.isFailure, true);
        assert.equal(result.getError(), error);
      },
    );
  });

  await t.test('fromThrowable', async (t) => {
    await t.test(
      'when fn throws error, should return expected value',
      async () => {
        function throwable() {
          throw new Error('error');
        }
        const throwableResult =
          Result.fromThrowable(throwable);
        const result = throwableResult();
        assert.equal(result.getError().message, 'error');
      },
    );

    await t.test(
      'when async fn throws error, should return expected value',
      async () => {
        async function throwable() {
          throw new Error('error');
        }
        const throwableResult =
          Result.fromThrowable(throwable);
        const result = await throwableResult();
        assert.equal(result.getError().message, 'error');
      },
    );

    await t.test(
      'when fn throws error with parsed error, should return expected value',
      async () => {
        function throwable() {
          throw new Error('error');
        }
        const throwableResult = Result.fromThrowable(
          throwable,
          (error) => error.message as string,
        );
        const result = throwableResult();
        assert.equal(result.getError(), 'error');
      },
    );

    await t.test(
      'when fn returns value, should return expected value',
      async () => {
        function notThrowable(text: string) {
          return text;
        }
        const notThrowableResult =
          Result.fromThrowable(notThrowable);
        const result = notThrowableResult('text');
        assert.equal(result.getValue(), 'text');
      },
    );

    await t.test(
      'when async fn returns value, should return expected value',
      async () => {
        async function notThrowable(text: string) {
          return Promise.resolve(text);
        }
        const notThrowableResult =
          Result.fromThrowable(notThrowable);
        const result = await notThrowableResult('text');
        assert.equal(result.getValue(), 'text');
      },
    );
  });
});
