import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deferredPromise } from '@daisugi/kintsugi';

import { Nekobasu } from '../nekobasu.js';

describe('Nekobasu', () => {
  describe('#publish', () => {
    it('should work multicast', async () => {
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

    it('should subscribe by wildcard', async () => {
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
    });

    it('should allow mutate event', async () => {
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

  describe('#unsubscribe', () => {
    it('should work', async () => {
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

  describe('#list', () => {
    it('should work', () => {
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
