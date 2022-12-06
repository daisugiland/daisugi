import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Daisugi } from '../daisugi.js';
import type { Handler, Toolkit } from '../types.js';

interface Obj {
  sum: string;
}

test('sequenceOf ', async (t) => {
  await t.test('downstream', async (t) => {
    await t.test('synchronous', async (t) => {
      await t.test('basic', async () => {
        const { sequenceOf } = new Daisugi();

        function a(arg1: string) {
          return `${arg1}1`;
        }

        function b(arg1: string) {
          return `${arg1}2`;
        }

        function c(arg1: string) {
          return `${arg1}3`;
        }

        const result = sequenceOf([a, b, c])(0);

        assert.strictEqual(result, '0123');
      });

      await t.test('composing', async () => {
        const { sequenceOf } = new Daisugi();

        function a(arg1: string) {
          return `${arg1}1`;
        }

        function b(arg1: string) {
          return `${arg1}2`;
        }

        function c(arg1: string) {
          return `${arg1}3`;
        }

        function d(arg1: string) {
          return `${arg1}4`;
        }

        const result = sequenceOf([
          a,
          sequenceOf([b, c]),
          d,
        ])(0);

        assert.strictEqual(result, '01234');
      });

      await t.test(
        'Daisugi.stopPropagationWith',
        async () => {
          const { sequenceOf } = new Daisugi();

          function a(arg1: string) {
            return `${arg1}1`;
          }

          function b(arg1: string) {
            return Daisugi.stopPropagationWith(`${arg1}2`);
          }

          function c(arg1: string) {
            return `${arg1}3`;
          }

          const result = sequenceOf([a, b, c])(0);

          assert.strictEqual(result, '012');
        },
      );

      await t.test('Daisugi.failWith', async () => {
        const { sequenceOf } = new Daisugi();

        function a(arg1: string) {
          return `${arg1}1`;
        }

        function b(arg1: string) {
          return Daisugi.failWith(`${arg1}2`);
        }

        function c(arg1: string) {
          return `${arg1}3`;
        }

        const result = sequenceOf([
          a,
          sequenceOf([b, c]),
          c,
        ])(0);

        assert.strictEqual(result.getError().value, '012');
      });
    });

    await t.test('asynchronous', async (t) => {
      await t.test('basic', async () => {
        const { sequenceOf } = new Daisugi();

        async function a(arg1: string) {
          return `${arg1}1`;
        }

        async function b(arg1: string) {
          return `${arg1}2`;
        }

        async function c(arg1: string) {
          return `${arg1}3`;
        }

        const result = await sequenceOf([a, b, c])(0);

        assert.strictEqual(result, '0123');
      });
    });
  });

  await t.test('downstream/upstream', async (t) => {
    await t.test('synchronous', async (t) => {
      await t.test('Daisugi.failWith', async () => {
        const { sequenceOf } = new Daisugi();

        const obj1 = { sum: 0 };

        function a(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          toolkit.next;

          arg1.sum = `${arg1.sum}5`;

          return arg1;
        }

        a.meta = { injectToolkit: true };

        function b(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}2`;

          return toolkit.failWith(arg1);
        }

        b.meta = { injectToolkit: true };

        function c(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}3`;

          toolkit.next;

          arg1.sum = `${arg1.sum}4`;

          return arg1;
        }

        c.meta = { injectToolkit: true };

        const result = sequenceOf([
          a,
          sequenceOf([b, c]),
          c,
        ])(obj1);

        assert.strictEqual(result.sum, '0125');
      });

      await t.test(
        'next with multiple arguments',
        async () => {
          const { sequenceOf } = new Daisugi();

          const obj1 = { sum: 0 };

          const obj2 = { sum: 0 };

          function a(
            arg1: Obj,
            arg2: Obj,
            toolkit: Toolkit,
          ) {
            arg1.sum = `${arg1.sum}1`;
            arg2.sum = `${arg2.sum}1`;

            toolkit.next;

            arg1.sum = `${arg1.sum}6`;
          }

          a.meta = { injectToolkit: true };

          function b(
            arg1: Obj,
            arg2: Obj,
            toolkit: Toolkit,
          ) {
            arg1.sum = `${arg1.sum}2`;
            arg2.sum = `${arg2.sum}2`;

            toolkit.next;

            arg1.sum = `${arg1.sum}5`;
          }

          b.meta = { injectToolkit: true };

          function c(
            arg1: Obj,
            arg2: Obj,
            toolkit: Toolkit,
          ) {
            arg1.sum = `${arg1.sum}3`;
            arg2.sum = `${arg2.sum}3`;

            toolkit.next;

            arg1.sum = `${arg1.sum}4`;
          }

          c.meta = { injectToolkit: true };

          sequenceOf([a, b, c])(obj1, obj2);

          assert.strictEqual(obj1.sum, '0123456');
          assert.strictEqual(obj2.sum, '0123');
        },
      );

      await t.test('nextWith', async () => {
        const { sequenceOf } = new Daisugi();

        function a(arg1: Obj, toolkit: Toolkit) {
          const result = toolkit.nextWith(`${arg1}1`);

          return `${result}5`;
        }

        a.meta = { injectToolkit: true };

        function b(arg1: Obj, toolkit: Toolkit) {
          const result = toolkit.nextWith(`${arg1}2`);

          return `${result}4`;
        }

        b.meta = { injectToolkit: true };

        function c(arg1: string) {
          return `${arg1}3`;
        }

        const result = sequenceOf([a, b, c])(0);

        assert.strictEqual(result, '012345');
      });

      await t.test(
        'nextWith with multiple arguments',
        async () => {
          const { sequenceOf } = new Daisugi();

          function a(
            arg1: Obj,
            arg2: Obj,
            toolkit: Toolkit,
          ) {
            const result = toolkit.nextWith(
              `${arg1}${arg2}`,
              2,
            );

            return `${result}6`;
          }

          a.meta = { injectToolkit: true };

          function b(
            arg1: Obj,
            arg2: Obj,
            toolkit: Toolkit,
          ) {
            const result = toolkit.nextWith(
              `${arg1}${arg2}`,
              3,
            );

            return `${result}5`;
          }

          b.meta = { injectToolkit: true };

          function c(arg1: Obj, arg2: Obj) {
            return `${arg1}${arg2}4`;
          }

          const result = sequenceOf([a, b, c])(0, 1);

          assert.strictEqual(result, '0123456');
        },
      );

      await t.test('multiple calls', async () => {
        const { sequenceOf } = new Daisugi();

        function a(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          toolkit.next;

          return arg1;
        }

        a.meta = { injectToolkit: true };

        function b(arg1: Obj) {
          arg1.sum = `${arg1.sum}2`;

          return arg1;
        }

        const handler = sequenceOf([a, b]);

        assert.strictEqual(handler({ sum: 0 }).sum, '012');
        assert.strictEqual(handler({ sum: 0 }).sum, '012');
      });
    });

    await t.test('asynchronous', async (t) => {
      const { sequenceOf } = new Daisugi();

      await t.test('next', async () => {
        const obj1 = { sum: 0 };

        async function a(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}6`;
        }

        a.meta = { injectToolkit: true };

        async function b(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}2`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}5`;
        }

        b.meta = { injectToolkit: true };

        async function c(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}3`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}4`;
        }

        c.meta = { injectToolkit: true };

        await sequenceOf([a, b, c])(obj1);

        assert.strictEqual(obj1.sum, '0123456');
      });

      await t.test('nextWith', async () => {
        async function a(arg1: Obj, toolkit: Toolkit) {
          const result = await toolkit.nextWith(`${arg1}1`);

          return `${result}5`;
        }

        a.meta = { injectToolkit: true };

        async function b(arg1: Obj, toolkit: Toolkit) {
          const result = await toolkit.nextWith(`${arg1}2`);

          return `${result}4`;
        }

        b.meta = { injectToolkit: true };

        async function c(arg1: string) {
          return `${arg1}3`;
        }

        const result = await sequenceOf([a, b, c])(0);

        assert.strictEqual(result, '012345');
      });

      await t.test('composing', async () => {
        const { sequenceOf } = new Daisugi();

        const obj1 = { sum: 0 };

        async function a(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}8`;

          return arg1;
        }

        a.meta = { injectToolkit: true };

        async function b(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}2`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}5`;

          return arg1;
        }

        b.meta = { injectToolkit: true };

        async function c(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}3`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}4`;

          return arg1;
        }

        c.meta = { injectToolkit: true };

        async function d(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}6`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}7`;

          return arg1;
        }

        d.meta = { injectToolkit: true };

        const result = await sequenceOf([
          a,
          sequenceOf([b, c]),
          d,
        ])(obj1);

        assert.strictEqual(obj1.sum, '012345678');
        assert.strictEqual(result.sum, '012345678');
      });
    });

    await t.test('synchronous/asynchronous', async (t) => {
      await t.test('composing', async () => {
        const { sequenceOf } = new Daisugi();

        const obj1 = { sum: 0 };

        async function a(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}8`;

          return arg1;
        }

        a.meta = { injectToolkit: true };

        function b(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}2`;

          toolkit.next;

          arg1.sum = `${arg1.sum}5`;

          return arg1;
        }

        b.meta = { injectToolkit: true };

        async function c(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}3`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}4`;

          return arg1;
        }

        c.meta = { injectToolkit: true };

        function d(arg1: Obj, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}6`;

          toolkit.next;

          arg1.sum = `${arg1.sum}7`;

          return arg1;
        }

        d.meta = { injectToolkit: true };

        const result = await sequenceOf([
          a,
          sequenceOf([b, c]),
          d,
        ])(obj1);

        // TODO: Need to be reviewed.
        assert.strictEqual(obj1.sum, '012356748');
        assert.strictEqual(result.sum, '012356748');
      });
    });
  });
});

test('decorator', async (t) => {
  await t.test('basic', async () => {
    function decorator(handler: Handler) {
      return (arg1: string) => {
        return `${handler(arg1)}x`;
      };
    }

    const { sequenceOf } = new Daisugi([decorator]);

    function a(arg1: string) {
      return `${arg1}1`;
    }

    function b(arg1: string) {
      return `${arg1}2`;
    }

    const result = sequenceOf([a, b])(0);

    assert.strictEqual(result, '01x2x');
  });

  await t.test('synchronous/asynchronous', async () => {
    function decorator(handler: Handler) {
      return function (arg1: Obj, toolkit: Toolkit) {
        arg1.sum = `${arg1.sum}x`;

        handler(arg1, toolkit);

        arg1.sum = `${arg1.sum}y`;
      };
    }

    const { sequenceOf } = new Daisugi([decorator]);

    const obj1 = { sum: 0 };

    function a(arg1: Obj, toolkit: Toolkit) {
      arg1.sum = `${arg1.sum}1`;

      toolkit.next;

      arg1.sum = `${arg1.sum}6`;
    }

    a.meta = { injectToolkit: true };

    function b(arg1: Obj, toolkit: Toolkit) {
      arg1.sum = `${arg1.sum}2`;

      toolkit.next;

      arg1.sum = `${arg1.sum}5`;
    }

    b.meta = { injectToolkit: true };

    function c(arg1: Obj, toolkit: Toolkit) {
      arg1.sum = `${arg1.sum}3`;

      toolkit.next;

      arg1.sum = `${arg1.sum}4`;
    }

    c.meta = { injectToolkit: true };

    sequenceOf([a, b, c])(obj1);

    assert.strictEqual(obj1.sum, '0x1x2x34y5y6y');
  });

  await t.test('extend toolkit', async () => {
    function decorator(handler: Handler, toolkit: Toolkit) {
      toolkit.extended = (arg1: Obj) => {
        arg1.sum = `${arg1.sum}x`;
        toolkit.next;
      };

      return function (arg1: Obj, toolkit: Toolkit) {
        handler(arg1, toolkit);
      };
    }

    const { sequenceOf } = new Daisugi([decorator]);

    const obj1 = { sum: 0 };

    function a(arg1: Obj, toolkit: Toolkit) {
      arg1.sum = `${arg1.sum}1`;

      toolkit.extended(arg1);
    }

    a.meta = { injectToolkit: true };

    function b(arg1: Obj, toolkit: Toolkit) {
      arg1.sum = `${arg1.sum}2`;

      toolkit.extended(arg1);
    }

    b.meta = { injectToolkit: true };

    function c(arg1: Obj, toolkit: Toolkit) {
      arg1.sum = `${arg1.sum}3`;

      toolkit.extended(arg1);
    }

    c.meta = { injectToolkit: true };

    sequenceOf([a, b, c])(obj1);

    assert.strictEqual(obj1.sum, '01x2x3x');
  });

  await t.test('use meta', async () => {
    function decorator1(handler: Handler) {
      return function (arg1: Obj, toolkit: Toolkit) {
        arg1.sum = `${arg1.sum}${handler.meta!.arg}`;

        handler(arg1, toolkit);
      };
    }

    function decorator2(handler: Handler) {
      return function (arg1: Obj, toolkit: Toolkit) {
        arg1.sum = `${arg1.sum}${handler.meta!.arg}-`;

        handler(arg1, toolkit);
      };
    }

    const { sequenceOf } = new Daisugi([
      decorator1,
      decorator2,
    ]);

    const obj1 = { sum: 0 };

    function a(arg1: Obj, toolkit: Toolkit) {
      arg1.sum = `${arg1.sum}1`;

      toolkit.next;
    }

    a.meta = { injectToolkit: true, arg: 'x' };

    function b(arg1: Obj, toolkit: Toolkit) {
      arg1.sum = `${arg1.sum}2`;

      toolkit.next;
    }

    b.meta = { injectToolkit: true, arg: 'y' };

    sequenceOf([a, b])(obj1);

    assert.strictEqual(obj1.sum, '0x-x1y-y2');
  });
});
