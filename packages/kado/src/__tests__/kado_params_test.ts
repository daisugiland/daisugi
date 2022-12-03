import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Kado } from '../kado.js';

test('params', async (t) => {
  await t.test(
    'should resolve properly manifest item',
    async () => {
      const { container } = new Kado();
      class A {
        constructor(public b: string, public c: string) {
          this.b = b;
          this.c = c;
        }
      }
      container.register([
        {
          token: 'A',
          useClass: A,
          params: [
            { useValue: 'foo' },
            {
              useFactory() {
                return 'bar';
              },
            },
          ],
        },
      ]);
      const a = container.resolve<A>('A');
      assert.equal(a.b, 'foo');
      assert.equal(a.c, 'bar');
    },
  );

  await t.test(
    'should resolve properly Kado.value',
    async () => {
      const { container } = new Kado();
      class A {
        constructor(public b: string) {
          this.b = b;
        }
      }
      container.register([
        {
          token: 'A',
          useClass: A,
          params: [Kado.value('foo')],
        },
      ]);
      const a = container.resolve<A>('A');
      assert.equal(a.b, 'foo');
    },
  );

  await t.test(
    'should resolve properly Kado.map',
    async () => {
      const { container } = new Kado();
      class A {
        constructor(public b: string) {
          this.b = b;
        }
      }
      container.register([
        { token: 'b', useValue: 'foo' },
        {
          token: 'A',
          useClass: A,
          params: [Kado.map(['b'])],
        },
      ]);
      const a = container.resolve<A>('A');
      assert.equal(a.b[0], 'foo');
    },
  );

  await t.test(
    'should resolve properly Kado.flatMap',
    async () => {
      const { container } = new Kado();
      class A {
        constructor(public b: string) {
          this.b = b;
        }
      }
      container.register([
        { token: 'b', useValue: ['foo'] },
        {
          token: 'A',
          useClass: A,
          params: [Kado.flatMap(['b'])],
        },
      ]);
      const a = container.resolve<A>('A');
      assert.equal(a.b[0], 'foo');
    },
  );
});
