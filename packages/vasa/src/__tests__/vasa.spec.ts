import { vasa } from '../vasa';

describe('#vasa()', () => {
  it('useClass', () => {
    const { container } = vasa();

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
    const { container } = vasa();

    class A {
      constructor(public a) {}
    }

    container.register([
      {
        token: 'A',
        useClass: A,
        params: ['B'],
      },
      {
        token: 'B',
        useValue: 'foo',
      },
    ]);

    const a = container.resolve('A');

    expect(a.a).toBe('foo');
  });

  it('scope', () => {
    const { container } = vasa();

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

  it('nested scope', () => {
    const { container } = vasa();

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
    const { container } = vasa();

    function useFactory(container) {
      if (container.resolve('B') === 'foo') {
        return 'yes';
      }

      return 'no';
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

    expect(a).toBe('yes');
  });
});
