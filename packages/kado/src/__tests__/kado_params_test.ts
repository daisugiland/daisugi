import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { flatMap, Kado, map, value } from '../kado.js';

describe('params', () => {
  it('should resolve properly manifest item', async () => {
    const { container } = new Kado();
    class A {
      constructor(
        public b: string,
        public c: string,
      ) {}
    }
    container.register([
      {
        token: 'A',
        useClass: A,
        params: [
          { useValue: 'foo' },
          {
            useFn() {
              return 'bar';
            },
          },
        ],
      },
    ]);
    const a = await container.resolve<A>('A');
    assert.equal(a.b, 'foo');
    assert.equal(a.c, 'bar');
  });

  it('should resolve properly value', async () => {
    const { container } = new Kado();
    class A {
      constructor(public b: string) {}
    }
    container.register([
      {
        token: 'A',
        useClass: A,
        params: [value('foo')],
      },
    ]);
    const a = await container.resolve<A>('A');
    assert.equal(a.b, 'foo');
  });

  it('should resolve properly map', async () => {
    const { container } = new Kado();
    class A {
      constructor(public b: string) {}
    }
    container.register([
      { token: 'b', useValue: 'foo' },
      {
        token: 'A',
        useClass: A,
        params: [map(['b'])],
      },
    ]);
    const a = await container.resolve<A>('A');
    assert.equal(a.b[0], 'foo');
  });

  it('should resolve properly flatMap', async () => {
    const { container } = new Kado();
    class A {
      constructor(public b: string) {}
    }
    container.register([
      { token: 'b', useValue: ['foo'] },
      {
        token: 'A',
        useClass: A,
        params: [flatMap(['b'])],
      },
    ]);
    const a = await container.resolve<A>('A');
    assert.equal(a.b[0], 'foo');
  });
});
