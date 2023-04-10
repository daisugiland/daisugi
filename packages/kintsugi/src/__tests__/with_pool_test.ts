import assert from 'node:assert/strict';
import { test } from 'node:test';

import { deferredPromise } from '../deferred_promise.js';
import { createWithPool, withPool } from '../with_pool.js';

async function fn1(arg: string) {
  return arg;
}

interface Arg {
  isStarted: boolean;
  isDone: boolean;
  when: ReturnType<typeof deferredPromise>;
}

async function fn2(arg: Arg) {
  arg.isStarted = true;

  const response = await arg.when.promise;

  arg.isDone = true;

  return response;
}

function createParams(): Arg {
  return {
    isStarted: false,
    isDone: false,
    when: deferredPromise(),
  };
}

test('createWithPool', async (t) => {
  await t.test(
    'should provide expected function',
    async () => {
      assert.strictEqual(typeof createWithPool, 'function');
    },
  );

  await t.test(
    'when we customize concurrency',
    async (t) => {
      await t.test(
        'should be started and be done with expected responses',
        async () => {
          const { withPool } = createWithPool({
            concurrencyCount: 1,
          });

          const fnWithPool1 = withPool(fn2);
          const fnWithPool2 = withPool(fn2);

          const params1 = createParams();
          const when1 = fnWithPool1(params1);

          const params2 = createParams();
          const when2 = fnWithPool2(params2);

          assert.strictEqual(params1.isStarted, true);
          assert.strictEqual(params1.isDone, false);

          assert.strictEqual(params2.isStarted, false);
          assert.strictEqual(params2.isDone, false);

          params1.when.resolve('OK1');
          const response1 = await when1;

          assert.strictEqual(params1.isDone, true);
          assert.strictEqual(response1, 'OK1');

          assert.strictEqual(params2.isStarted, true);
          assert.strictEqual(params2.isDone, false);

          params2.when.resolve('OK2');
          const response2 = await when2;

          assert.strictEqual(params2.isDone, true);
          assert.strictEqual(response2, 'OK2');
        },
      );
    },
  );
});

test('withPool', async (t) => {
  await t.test(
    'should provide expected function',
    async () => {
      assert.strictEqual(typeof withPool, 'function');
    },
  );

  await t.test(
    'should return expected response based on arguments',
    async () => {
      const fnWithPool = withPool(fn1);

      const [response1, response2, response3] =
        await Promise.all([
          fnWithPool('OK1'),
          fnWithPool('OK2'),
          fnWithPool('OK3'),
        ]);

      assert.strictEqual(response1, 'OK1');
      assert.strictEqual(response2, 'OK2');
      assert.strictEqual(response3, 'OK3');
    },
  );

  await t.test(
    'when we sequentially call with concurrency of 2',
    async (t) => {
      await t.test(
        'should be started and be done with expected responses',
        async () => {
          const fnWithPool = withPool(fn2);

          // Call first, second, third and fourth functions.
          const params1 = createParams();
          const when1 = fnWithPool(params1);

          const params2 = createParams();
          fnWithPool(params2);

          const params3 = createParams();
          const when3 = fnWithPool(params3);

          const params4 = createParams();
          fnWithPool(params4);

          // First and second function should be started and should NOT be done.
          assert.strictEqual(params1.isStarted, true);
          assert.strictEqual(params2.isStarted, true);

          assert.strictEqual(params1.isDone, false);
          assert.strictEqual(params2.isDone, false);

          // Third and fourth function should NOT be started.
          assert.strictEqual(params3.isStarted, false);
          assert.strictEqual(params4.isStarted, false);

          // We resolve the promise of the first function.
          params1.when.resolve('OK1');

          // We wait for the first function to be done.
          const response1 = await when1;

          // First function should be done.
          assert.strictEqual(params1.isDone, true);
          assert.strictEqual(response1, 'OK1');

          // Second function should NOT be done.
          assert.strictEqual(params2.isDone, false);

          // Third function should be started.
          assert.strictEqual(params3.isStarted, true);

          // Fourth function should NOT be started.
          assert.strictEqual(params4.isStarted, false);

          // We resolve the promise of the third function.
          params3.when.resolve('OK3');

          // We wait for the third function to be done.
          const response3 = await when3;

          // Second function should NOT be done.
          assert.strictEqual(params2.isDone, false);

          // Third function should be done.
          assert.strictEqual(params3.isDone, true);
          assert.strictEqual(response3, 'OK3');

          // Fourth function should be started.
          assert.strictEqual(params4.isStarted, true);
        },
      );

      await t.test(
        'when we customize concurrency',
        async (t) => {
          await t.test(
            'should be started and be done with expected responses',
            async () => {
              const fnWithPool = withPool(fn2, {
                concurrencyCount: 1,
              });

              const params1 = createParams();
              const when1 = fnWithPool(params1);

              const params2 = createParams();
              const when2 = fnWithPool(params2);

              assert.strictEqual(params1.isStarted, true);
              assert.strictEqual(params1.isDone, false);

              assert.strictEqual(params2.isStarted, false);
              assert.strictEqual(params2.isDone, false);

              params1.when.resolve('OK1');
              const response1 = await when1;

              assert.strictEqual(params1.isDone, true);
              assert.strictEqual(response1, 'OK1');

              assert.strictEqual(params2.isStarted, true);
              assert.strictEqual(params2.isDone, false);

              params2.when.resolve('OK2');
              const response2 = await when2;

              assert.strictEqual(params2.isDone, true);
              assert.strictEqual(response2, 'OK2');
            },
          );
        },
      );

      await t.test(
        'when one function is rejected',
        async (t) => {
          await t.test(
            'should be started and be done with expected responses',
            async () => {
              const fnWithPool = withPool(fn2, {
                concurrencyCount: 1,
              });

              const params1 = createParams();
              const when1 = fnWithPool(params1);

              const params2 = createParams();
              const when2 = fnWithPool(params2);

              assert.strictEqual(params1.isStarted, true);
              assert.strictEqual(params1.isDone, false);

              assert.strictEqual(params2.isStarted, false);
              assert.strictEqual(params2.isDone, false);

              params1.when.reject('KO1');
              try {
                await when1;
              } catch (err) {
                assert.strictEqual(err, 'KO1');
              }

              assert.strictEqual(params1.isDone, false);

              assert.strictEqual(params2.isStarted, true);
              assert.strictEqual(params2.isDone, false);

              params2.when.resolve('OK2');
              const response2 = await when2;

              assert.strictEqual(params2.isDone, true);
              assert.strictEqual(response2, 'OK2');
            },
          );
        },
      );
    },
  );
});
