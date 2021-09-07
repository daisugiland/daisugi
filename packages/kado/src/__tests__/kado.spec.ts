import { kado } from '../kado';

describe('#kado()', () => {
  it('useClass', () => {
    const { container } = kado();

    class A {
      constructor(public b) {}
    }

    class B {
      foo = 'foo';
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
      constructor(public a) {}
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

    class A {
      constructor(public b) {}
    }

    class B {}

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

  it('useFactory', () => {
    const { container } = kado();

    function useFactory(container) {
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
        useFactory,
      },
    ]);

    const a = container.resolve('A');
    const anotherA = container.resolve('A');

    expect(typeof a).toBe('number');
    expect(a).toBe(anotherA);
  });

  it('useFactoryWithParams', () => {
    const { container } = kado();

    function useFactoryWithParams(b) {
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
        useFactoryWithParams,
        params: ['B'],
      },
    ]);

    const a = container.resolve('A');
    const anotherA = container.resolve('A');

    expect(typeof a).toBe('number');
    expect(a).toBe(anotherA);
  });

  it('useFactoryWithParams Transient', () => {
    const { container } = kado();

    function useFactoryWithParams(b) {
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
        useFactoryWithParams,
        params: ['B'],
        scope: 'Transient',
      },
    ]);

    const a = container.resolve('A');
    const anotherA = container.resolve('A');

    expect(typeof a).toBe('number');
    expect(a).not.toBe(anotherA);
  });

  it('useFactory Transient', () => {
    const { container } = kado();

    function useFactory() {
      return Math.random();
    }

    container.register([
      {
        token: 'A',
        useFactory,
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
        expect(error.message).toBe(
          'Attempted to resolve unregistered dependency token: "a".',
        );
        expect(error.code).toBe('NotFound');
        expect(error.name).toBe('NotFound');
      }
    });
  });

  describe('when you try to make a circular injection', () => {
    it('should throw an error', () => {
      const { container } = kado();

      container.register([
        {
          token: 'a',
          useClass: class A {
            constructor(public c) {}
          },
          params: ['c'],
        },
        {
          token: 'c',
          useClass: class C {
            constructor(public b) {}
          },
          params: ['b'],
        },
        {
          token: 'b',
          useClass: class B {
            constructor(public a) {}
          },
          params: ['a'],
        },
      ]);

      try {
        container.resolve('a');
      } catch (error) {
        expect(error.message).toBe(
          'Attempted to resolve circular dependency: "a" of "b" constructor.',
        );
        expect(error.code).toBe('FailedDependency');
        expect(error.name).toBe('FailedDependency');
      }
    });
  });
});
