import { Code, CustomError } from '@daisugi/kintsugi';

import { kado, Container } from '../kado.js';

describe('#kado()', () => {
  it('useClass', () => {
    const { container } = kado();

    class B {
      foo = 'foo';
    }

    class A {
      constructor(public b: B) {}
    }

    container.register([
      {
        token: 'A',
        useClass: A,
        params: ['B'],
      },
      {
        token: 'B',
        useClass: B,
      },
    ]);

    const a = container.resolve('A');
    const anotherA = container.resolve('A');

    expect(a.b.foo).toBe('foo');
    expect(a).toBe(anotherA);
  });

  it('useValue', () => {
    const { container } = kado();

    const b = Symbol('B');

    class A {
      constructor(public a: symbol) {}
    }

    container.register([
      {
        token: 'A',
        useClass: A,
        params: [b],
      },
      {
        token: b,
        useValue: 'foo',
      },
    ]);

    const a = container.resolve('A');

    expect(a.a).toBe('foo');
  });

  it('useValue false', () => {
    const { container } = kado();

    const b = Symbol('B');

    class A {
      constructor(public a: symbol) {}
    }

    container.register([
      {
        token: 'A',
        useClass: A,
        params: [b],
      },
      {
        token: b,
        useValue: false,
      },
    ]);

    const a = container.resolve('A');

    expect(a.a).toBe(false);
  });

  it('useClass Transient', () => {
    const { container } = kado();

    class A {
      constructor() {}
    }

    container.register([
      {
        token: 'A',
        useClass: A,
        scope: 'Transient',
      },
    ]);

    const a = container.resolve('A');
    const anotherA = container.resolve('A');

    expect(a).not.toBe(anotherA);
  });

  it('nested scope Transient', () => {
    const { container } = kado();

    class B {}

    class A {
      constructor(public b: B) {}
    }

    container.register([
      {
        token: 'A',
        useClass: A,
        params: ['B'],
      },
      {
        token: 'B',
        useClass: B,
        scope: 'Transient',
      },
    ]);

    const a = container.resolve('A');
    const anotherA = container.resolve('A');

    expect(a.b).toBe(anotherA.b);
  });

  it('useFactoryWithContainer', () => {
    const { container } = kado();

    function useFactoryWithContainer(container: Container) {
      if (container.resolve('B') === 'foo') {
        return Math.random();
      }

      return null;
    }

    container.register([
      {
        token: 'B',
        useValue: 'foo',
      },
      {
        token: 'A',
        useFactoryWithContainer,
      },
    ]);

    const a = container.resolve('A');
    const anotherA = container.resolve('A');

    expect(typeof a).toBe('number');
    expect(a).toBe(anotherA);
  });

  it('useFactory', () => {
    const { container } = kado();

    function useFactory(b: string) {
      if (b === 'foo') {
        return Math.random();
      }

      return null;
    }

    container.register([
      {
        token: 'B',
        useValue: 'foo',
      },
      {
        token: 'A',
        useFactory,
        params: ['B'],
      },
    ]);

    const a = container.resolve('A');
    const anotherA = container.resolve('A');

    expect(typeof a).toBe('number');
    expect(a).toBe(anotherA);
  });

  it('useFactory Transient', () => {
    const { container } = kado();

    function useFactory(b: string) {
      if (b === 'foo') {
        return Math.random();
      }

      return null;
    }

    container.register([
      {
        token: 'B',
        useValue: 'foo',
      },
      {
        token: 'A',
        useFactory,
        params: ['B'],
        scope: 'Transient',
      },
    ]);

    const a = container.resolve('A');
    const anotherA = container.resolve('A');

    expect(typeof a).toBe('number');
    expect(a).not.toBe(anotherA);
  });

  it('useFactoryWithContainer Transient', () => {
    const { container } = kado();

    function useFactoryWithContainer() {
      return Math.random();
    }

    container.register([
      {
        token: 'A',
        useFactoryWithContainer,
        scope: 'Transient',
      },
    ]);

    const a = container.resolve('A');
    const anotherA = container.resolve('A');

    expect(a).not.toBe(anotherA);
  });

  it('#list()', () => {
    const { container } = kado();

    container.register([
      {
        token: 'a',
        useValue: 'text',
      },
    ]);

    const list = container.list();

    expect(list).toEqual([
      {
        token: 'a',
        useValue: 'text',
      },
    ]);
  });

  describe('when you try to resolve unregistered token', () => {
    it('should throw an error', () => {
      const { container } = kado();

      try {
        container.resolve('a');
      } catch (error) {
        expect((error as CustomError).message).toBe(
          'Attempted to resolve unregistered dependency token: "a".',
        );
        expect((error as CustomError).code).toBe(
          Code.NotFound,
        );
        expect((error as CustomError).name).toBe(
          Code.NotFound,
        );
      }
    });
  });

  describe('when you try to resolve deep unregistered token', () => {
    it('should throw an error', () => {
      const { container } = kado();

      container.register([
        {
          token: 'a',
          useFactory() {},
          params: ['b'],
        },
      ]);

      try {
        container.resolve('a');
      } catch (error) {
        expect((error as CustomError).message).toBe(
          'Attempted to resolve unregistered dependency token: "b".',
        );
        expect((error as CustomError).code).toBe(
          Code.NotFound,
        );
        expect((error as CustomError).name).toBe(
          Code.NotFound,
        );
      }
    });
  });

  describe('when you try to make a circular injection', () => {
    it('should throw an error', () => {
      const { container } = kado();

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
        {
          token: 'a',
          useClass: A,
          params: ['b'],
        },
        {
          token: 'b',
          useClass: B,
          params: ['c'],
        },
        {
          token: 'c',
          useClass: C,
          params: ['a'],
        },
      ]);

      try {
        container.resolve('a');
      } catch (error) {
        expect((error as CustomError).message).toBe(
          'Attempted to resolve circular dependency: "a" ➡️ "b" ➡️ "c" 🔄 "a".',
        );
        expect((error as CustomError).code).toBe(
          Code.CircularDependencyDetected,
        );
        expect((error as CustomError).name).toBe(
          Code.CircularDependencyDetected,
        );
      }
    });
  });

  describe('when no circular injection detected', () => {
    it('should not throw an error', () => {
      const { container } = kado();

      class C {
        constructor(public b: B) {}
      }

      class B {
        constructor() {}
      }

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
        {
          token: 'b',
          useClass: B,
        },
        {
          token: 'c',
          useClass: C,
          params: ['b'],
        },
      ]);

      const a = container.resolve('a');

      expect(a).toBeInstanceOf(A);
    });
  });
});
