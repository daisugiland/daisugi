import { deferredPromise } from '@daisugi/kintsugi';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Nekobasu } from '../nekobasu.js';

test('Nekobasu', async (t) => {
  await t.test('#publish', async (t) => {
    await t.test('should work multicast', async () => {
      const whenIsStarted1 = deferredPromise();
      const nekobasu = new Nekobasu();
      nekobasu.subscribe('foo', async (event) => {
        whenIsStarted1.resolve([1, event]);
      });
      const whenIsStarted2 = deferredPromise();
      nekobasu.subscribe('foo', async (event) => {
        whenIsStarted2.resolve([2, event]);
      });
      const event = await nekobasu.dispatch('foo', 'bar');
      const response = await Promise.all([
        whenIsStarted1.promise,
        whenIsStarted2.promise,
      ]);
      assert.deepEqual(response[0], [1, event]);
      assert.deepEqual(response[1], [2, event]);
      assert.notStrictEqual(event, {
        topicName: 'foo',
        payload: 'bar',
        mut: {},
      });
    });

    await t.test(
      'should subscribe by wildcard',
      async () => {
        const whenIsStarted1 = deferredPromise();
        const nekobasu = new Nekobasu();
        nekobasu.subscribe('*', async (event) => {
          whenIsStarted1.resolve([1, event]);
        });
        const whenIsStarted2 = deferredPromise();
        nekobasu.subscribe('foo.*.baz', async (event) => {
          whenIsStarted2.resolve([2, event]);
        });
        const event = await nekobasu.dispatch(
          'foo.bar.baz',
          'bar',
        );
        const response = await Promise.all([
          whenIsStarted1.promise,
          whenIsStarted2.promise,
        ]);
        assert.deepEqual(response[0], [1, event]);
        assert.deepEqual(response[1], [2, event]);
      },
    );

    await t.test('should allow mutate event', async () => {
      const whenIsStarted1 = deferredPromise();
      const nekobasu = new Nekobasu();
      nekobasu.subscribe('foo', async (event) => {
        event.mut = { foo: 'bar' };
        whenIsStarted1.resolve([1, event]);
      });
      const event = await nekobasu.dispatch('foo', 'bar');
      // @ts-ignore
      assert.equal(event.mut.foo, 'bar');
    });
  });

  await t.test('#unsubscribe', async (t) => {
    await t.test('should work', async () => {
      const whenIsStarted1 = deferredPromise();
      const nekobasu = new Nekobasu();
      const subId = nekobasu.subscribe(
        'foo',
        async (event) => {
          whenIsStarted1.resolve([1, event]);
        },
      );
      nekobasu.unsubscribe(subId);
      await nekobasu.dispatch('foo', 'bar');
      assert.equal(whenIsStarted1.isPending(), true);
    });
  });

  await t.test('#list', async (t) => {
    await t.test('should work', () => {
      const nekobasu = new Nekobasu();
      async function eventHandler() {
        return null;
      }
      nekobasu.subscribe('foo', eventHandler);
      assert.deepEqual(nekobasu.list(), [
        {
          subId: 1,
          topicRe: /^foo$/,
          topicWildcard: 'foo',
          eventHandler,
        },
      ]);
    });
  });
});
