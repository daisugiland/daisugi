import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Ayamari, type AyamariErr } from '@daisugi/ayamari';

import {
  Kado,
  type KadoContainer,
  type KadoManifestItem,
} from '../kado.js';

describe('Kado', () => {
  it('should have proper api', () => {
    assert.strictEqual(typeof Kado, 'function');
    assert.strictEqual(typeof Kado.value, 'function');
    assert.strictEqual(typeof Kado.map, 'function');
    assert.strictEqual(typeof Kado.flatMap, 'function');

    const { container } = new Kado();

    assert.strictEqual(
      typeof container.resolve,
      'function',
    );
    assert.strictEqual(
      typeof container.register,
      'function',
    );
    assert.strictEqual(typeof container.list, 'function');
    assert.strictEqual(typeof container.get, 'function');
  });

  it('#get()', () => {
    const { container } = new Kado();
    const manifestItem = { token: 'a' };
    container.register([manifestItem]);
    assert.equal(container.get('a'), manifestItem);
  });

  it('useClass', async () => {
    const { container } = new Kado();

    class B {
      foo = 'foo';
    }

    class A {
      constructor(public b: B) {}
    }

    container.register([
      { token: 'A', useClass: A, params: ['B'] },
      { token: 'B', useClass: B },
    ]);

    const a = await container.resolve<A>('A');
    const anotherA = await container.resolve<A>('A');

    assert.strictEqual(a.b.foo, 'foo');
    assert.strictEqual(a, anotherA);
  });

  it('useValue', async () => {
    const { container } = new Kado();

    const b = Symbol('B');

    class A {
      constructor(public a: symbol) {}
    }

    container.register([
      { token: 'A', useClass: A, params: [b] },
      { token: b, useValue: 'foo' },
    ]);

    const a = await container.resolve<A>('A');

    assert.strictEqual(a.a, 'foo');
  });

  it('useValue false', async () => {
    const { container } = new Kado();

    const b = Symbol('B');

    class A {
      constructor(public a: symbol) {}
    }

    container.register([
      { token: 'A', useClass: A, params: [b] },
      { token: b, useValue: false },
    ]);

    const a = await container.resolve<A>('A');

    assert.strictEqual(a.a, false);
  });

  it('should resolve Singleton only once', async () => {
    const { container } = new Kado();
    let count = 0;
    container.register([
      {
        token: 'a',
        async useFn() {
          count++;
        },
        params: [{ useValue: 'foo' }]
      },
      {
        token: 'A',
        useFn() {},
        params: ['a', 'a'],
      },
    ]);
    await container.resolve<string>('A');
    assert.strictEqual(count, 1);
  });

  it('useClass Transient', async () => {
    const { container } = new Kado();
    let count = 0;
    container.register([
      {
        token: 'a',
        async useFn() {
          count++;
        },
        params: [{ useValue: 'foo' }],
        scope: Kado.scope.Transient
      },
      {
        token: 'A',
        useFn() {},
        params: ['a', 'a'],
      },
    ]);
    await container.resolve<string>('A');
    assert.strictEqual(count, 2);
  });

  it('nested scope Transient', async () => {
    const { container } = new Kado();

    class B {}

    class A {
      constructor(public b: B) {}
    }

    container.register([
      { token: 'A', useClass: A, params: ['B'] },
      { token: 'B', useClass: B, scope: Kado.scope.Transient },
    ]);

    const a = await container.resolve<A>('A');
    const anotherA = await container.resolve<A>('A');

    assert.strictEqual(a.b, anotherA.b);
  });

  describe('useFnByContainer', () => {
    it('should resolve properly the container', async () => {
      const { container } = new Kado();
      async function useFnByContainer(c: KadoContainer) {
        const b = await c.resolve('B');
        return b;
      }
      async function useFn() {
        return 'foo';
      }
      container.register([
        { token: 'B', useFn },
        { token: 'A', useFnByContainer },
      ]);
      const a = await container.resolve<string>('A');
      assert.strictEqual(a, 'foo');
    });

    it('should resolve properly the class', async () => {
      const { container } = new Kado();

      async function useFnByContainer(c: KadoContainer) {
        if ((await c.resolve('B')) === 'foo') {
          return Math.random();
        }

        return null;
      }

      container.register([
        { token: 'B', useValue: 'foo' },
        { token: 'A', useFnByContainer },
      ]);

      const a = await container.resolve<number>('A');
      const anotherA = await container.resolve<number>('A');

      assert.strictEqual(typeof a, 'number');
      assert.strictEqual(a, anotherA);
    });

    it('should return the list of manifest items', async () => {
      const { container } = new Kado();

      function useFnByContainer(c: KadoContainer) {
        return c.list();
      }

      const manifestItems: KadoManifestItem[] = [
        { token: 'B', useValue: 'foo' },
        { token: 'A', useFnByContainer },
      ];

      container.register(manifestItems);

      const a =
        await container.resolve<KadoManifestItem[]>('A');

      assert.deepEqual(a, manifestItems);
    });
  });

  it('useFn', async () => {
    const { container } = new Kado();
    function useFn(b: string) {
      if (b === 'foo') {
        return Math.random();
      }
      return null;
    }
    container.register([
      { token: 'B', useValue: 'foo' },
      { token: 'A', useFn, params: ['B'] },
    ]);
    const a = await container.resolve<number>('A');
    const anotherA = await container.resolve<number>('A');
    assert.strictEqual(typeof a, 'number');
    assert.strictEqual(a, anotherA);
  });

  it('async useFn', async () => {
    const { container } = new Kado();
    class A {
      get() {
        return 'a';
      }
    }
    async function useFnByContainer(c: KadoContainer) {
      const a = await c.resolve('a');
      return a;
    }
    async function useFn1(a: A) {
      return a.get();
    }
    function useFn2() {
      return 'b';
    }
    container.register([
      { token: 'c', useFnByContainer },
      { token: 'A', useClass: A },
      { token: 'a', useFn: useFn1, params: ['A'] },
      { token: 'b', useFn: useFn2 },
      { token: 'd', useValue: 'd' },
    ]);
    const a = await container.resolve('a');
    const b = await container.resolve('b');
    const c = await container.resolve('c');
    const d = await container.resolve('d');
    assert.strictEqual(a, 'a');
    assert.strictEqual(b, 'b');
    assert.strictEqual(c, 'a');
    assert.strictEqual(d, 'd');
  });

  it('useFn Transient', async () => {
    const { container } = new Kado();

    function useFn(b: string) {
      if (b === 'foo') {
        return Math.random();
      }

      return null;
    }

    container.register([
      { token: 'B', useValue: 'foo' },
      {
        token: 'A',
        useFn,
        params: ['B'],
        scope: 'Transient',
      },
    ]);

    const a = await container.resolve<number>('A');
    const anotherA = await container.resolve<number>('A');

    assert.strictEqual(typeof a, 'number');
    assert.notStrictEqual(a, anotherA);
  });

  it('useFnByContainer Transient', async () => {
    const { container } = new Kado();

    function useFnByContainer() {
      return Math.random();
    }

    container.register([
      {
        token: 'A',
        useFnByContainer,
        scope: 'Transient',
      },
    ]);

    const a = await container.resolve<number>('A');
    const anotherA = await container.resolve<number>('A');

    assert.notStrictEqual(a, anotherA);
  });

  it('#list()', () => {
    const { container } = new Kado();

    container.register([{ token: 'a', useValue: 'text' }]);

    const list = container.list();

    assert.deepStrictEqual(list, [
      { token: 'a', useValue: 'text' },
    ]);
  });

  it('#list() with symbol keys', () => {
    const { container } = new Kado();
    const token = Symbol('a');
    container.register([{ token, useValue: 'text' }]);

    const list = container.list();

    assert.deepStrictEqual(list, [
      { token, useValue: 'text' },
    ]);
  });

  describe('when you try to resolve unregistered token', () => {
    it('should throw an err', async () => {
      const { container } = new Kado();

      try {
        await container.resolve('a');
      } catch (err) {
        assert.strictEqual(
          (err as AyamariErr).message,
          'Attempted to resolve unregistered dependency token: "a".',
        );
        assert.strictEqual(
          (err as AyamariErr).code,
          Ayamari.errCode.NotFound,
        );
        assert.strictEqual(
          (err as AyamariErr).name,
          'NotFound [404]',
        );
      }
    });
  });

  describe('when you try to resolve deep unregistered token', () => {
    it('should throw an err', async () => {
      const { container } = new Kado();

      container.register([
        { token: 'a', useFn() {}, params: ['b'] },
      ]);

      try {
        await container.resolve('a');
      } catch (err) {
        assert.strictEqual(
          (err as AyamariErr).message,
          'Attempted to resolve unregistered dependency token: "b".',
        );
        assert.strictEqual(
          (err as AyamariErr).code,
          Ayamari.errCode.NotFound,
        );
        assert.strictEqual(
          (err as AyamariErr).name,
          'NotFound [404]',
        );
      }
    });
  });

  describe('when you try to make a circular injection', () => {
    it('should throw an err', async () => {
      const { container } = new Kado();

      class C {
        constructor(public a: A) {}
      }

      class B {
        constructor(public c: C) {}
      }

      class A {
        constructor(public b: B) {}
      }

      container.register([
        { token: 'a', useClass: A, params: ['b'] },
        { token: 'b', useClass: B, params: ['c'] },
        { token: 'c', useClass: C, params: ['a'] },
      ]);

      try {
        await container.resolve('a');
      } catch (err) {
        assert.strictEqual(
          (err as AyamariErr).message,
          'Attempted to resolve circular dependency: "a" ➡️ "b" ➡️ "c" 🔄 "a".',
        );
        assert.strictEqual(
          (err as AyamariErr).code,
          Ayamari.errCode.CircularDependencyDetected,
        );
        assert.strictEqual(
          (err as AyamariErr).name,
          'CircularDependencyDetected [578]',
        );
      }
    });
  });

  describe('when no circular injection detected', () => {
    it('should not throw an err', async () => {
      const { container } = new Kado();

      class C {
        constructor(public b: B) {}
      }

      class B {}

      class A {
        constructor(
          public b: B,
          public b2: B,
          public c: C,
        ) {}
      }

      container.register([
        {
          token: 'a',
          useClass: A,
          params: ['b', 'b', 'c'],
        },
        { token: 'b', useClass: B },
        { token: 'c', useClass: C, params: ['b'] },
      ]);

      const a = await container.resolve('a');

      assert(a instanceof A);
    });
  });
});
