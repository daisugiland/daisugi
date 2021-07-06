import { vasa } from '../vasa';

describe('#vasa()', () => {
  it('a', () => {
    const { container } = vasa();

    class A {
      b;

      constructor(b) {
        this.b = b;
      }
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

    expect(a.b.foo).toBe('foo');
  });
});
