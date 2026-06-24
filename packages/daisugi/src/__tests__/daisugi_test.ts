import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createSequenceOf,
  failWith,
  stopWith,
  type DaisugiFlow,
  type DaisugiHandler,
} from '../daisugi.js';

interface Obj {
  sum: string;
}

describe('sequenceOf ', () => {
  describe('downstream', () => {
    describe('synchronous', () => {
      it('basic', () => {
        const sequenceOf = createSequenceOf();

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

      it('composing', () => {
        const sequenceOf = createSequenceOf();

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

      it('stopWith', () => {
        const sequenceOf = createSequenceOf();

        function a(arg1: string) {
          return `${arg1}1`;
        }

        function b(arg1: string) {
          return stopWith(`${arg1}2`);
        }

        function c(arg1: string) {
          return `${arg1}3`;
        }

        const result = sequenceOf([a, b, c])(0);

        assert.strictEqual(result, '012');
      });

      it('failWith', () => {
        const sequenceOf = createSequenceOf();

        function a(arg1: string) {
          return `${arg1}1`;
        }

        function b(arg1: string) {
          return failWith(`${arg1}2`);
        }

        function c(arg1: string) {
          return `${arg1}3`;
        }

        const result = sequenceOf([
          a,
          sequenceOf([b, c]),
          c,
        ])(0);

        assert.strictEqual(
          result.unwrapErr().meta.value,
          '012',
        );
      });
    });

    describe('asynchronous', () => {
      it('basic', async () => {
        const sequenceOf = createSequenceOf();

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

  describe('downstream/upstream', () => {
    describe('synchronous', () => {
      it('failWith', () => {
        const sequenceOf = createSequenceOf();

        const obj1 = { sum: 0 };

        function a(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}1`;

          flow.next();

          arg1.sum = `${arg1.sum}5`;

          return arg1;
        }

        a.meta = { withFlow: true };

        function b(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}2`;

          return flow.failWith(arg1);
        }

        b.meta = { withFlow: true };

        function c(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}3`;

          flow.next();

          arg1.sum = `${arg1.sum}4`;

          return arg1;
        }

        c.meta = { withFlow: true };

        const result = sequenceOf([
          a,
          sequenceOf([b, c]),
          c,
        ])(obj1);

        assert.strictEqual(result.sum, '0125');
      });

      it('next with multiple arguments', () => {
        const sequenceOf = createSequenceOf();

        const obj1 = { sum: 0 };

        const obj2 = { sum: 0 };

        function a(
          arg1: Obj,
          arg2: Obj,
          flow: DaisugiFlow,
        ) {
          arg1.sum = `${arg1.sum}1`;
          arg2.sum = `${arg2.sum}1`;

          flow.next();

          arg1.sum = `${arg1.sum}6`;
        }

        a.meta = { withFlow: true };

        function b(
          arg1: Obj,
          arg2: Obj,
          flow: DaisugiFlow,
        ) {
          arg1.sum = `${arg1.sum}2`;
          arg2.sum = `${arg2.sum}2`;

          flow.next();

          arg1.sum = `${arg1.sum}5`;
        }

        b.meta = { withFlow: true };

        function c(
          arg1: Obj,
          arg2: Obj,
          flow: DaisugiFlow,
        ) {
          arg1.sum = `${arg1.sum}3`;
          arg2.sum = `${arg2.sum}3`;

          flow.next();

          arg1.sum = `${arg1.sum}4`;
        }

        c.meta = { withFlow: true };

        sequenceOf([a, b, c])(obj1, obj2);

        assert.strictEqual(obj1.sum, '0123456');
        assert.strictEqual(obj2.sum, '0123');
      });

      it('next with an explicit argument', () => {
        const sequenceOf = createSequenceOf();

        function a(arg1: Obj, flow: DaisugiFlow) {
          const result = flow.next(`${arg1}1`);

          return `${result}5`;
        }

        a.meta = { withFlow: true };

        function b(arg1: Obj, flow: DaisugiFlow) {
          const result = flow.next(`${arg1}2`);

          return `${result}4`;
        }

        b.meta = { withFlow: true };

        function c(arg1: string) {
          return `${arg1}3`;
        }

        const result = sequenceOf([a, b, c])(0);

        assert.strictEqual(result, '012345');
      });

      it('next with explicit multiple arguments', () => {
        const sequenceOf = createSequenceOf();

        function a(
          arg1: Obj,
          arg2: Obj,
          flow: DaisugiFlow,
        ) {
          const result = flow.next(`${arg1}${arg2}`, 2);

          return `${result}6`;
        }

        a.meta = { withFlow: true };

        function b(
          arg1: Obj,
          arg2: Obj,
          flow: DaisugiFlow,
        ) {
          const result = flow.next(`${arg1}${arg2}`, 3);

          return `${result}5`;
        }

        b.meta = { withFlow: true };

        function c(arg1: Obj, arg2: Obj) {
          return `${arg1}${arg2}4`;
        }

        const result = sequenceOf([a, b, c])(0, 1);

        assert.strictEqual(result, '0123456');
      });

      it('multiple calls', () => {
        const sequenceOf = createSequenceOf();

        function a(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}1`;

          flow.next();

          return arg1;
        }

        a.meta = { withFlow: true };

        function b(arg1: Obj) {
          arg1.sum = `${arg1.sum}2`;

          return arg1;
        }

        const handler = sequenceOf([a, b]);

        assert.strictEqual(handler({ sum: 0 }).sum, '012');
        assert.strictEqual(handler({ sum: 0 }).sum, '012');
      });
    });

    describe('asynchronous', () => {
      const sequenceOf = createSequenceOf();

      it('next', async () => {
        const obj1 = { sum: 0 };

        async function a(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}1`;

          await flow.next();

          arg1.sum = `${arg1.sum}6`;
        }

        a.meta = { withFlow: true };

        async function b(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}2`;

          await flow.next();

          arg1.sum = `${arg1.sum}5`;
        }

        b.meta = { withFlow: true };

        async function c(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}3`;

          await flow.next();

          arg1.sum = `${arg1.sum}4`;
        }

        c.meta = { withFlow: true };

        await sequenceOf([a, b, c])(obj1);

        assert.strictEqual(obj1.sum, '0123456');
      });

      it('concurrent invocations do not share flow state', async () => {
        async function a(_arg1: string, flow: DaisugiFlow) {
          // Yield before reading `next`, opening the window where a shared
          // flow would let a concurrent call overwrite these args.
          await Promise.resolve();

          return flow.next();
        }

        a.meta = { withFlow: true };

        async function b(arg1: string) {
          return `handled:${arg1}`;
        }

        const handler = sequenceOf([a, b]);

        const [first, second] = await Promise.all([
          handler('first'),
          handler('second'),
        ]);

        assert.strictEqual(first, 'handled:first');
        assert.strictEqual(second, 'handled:second');
      });

      it('next with an explicit argument', async () => {
        async function a(arg1: Obj, flow: DaisugiFlow) {
          const result = await flow.next(`${arg1}1`);

          return `${result}5`;
        }

        a.meta = { withFlow: true };

        async function b(arg1: Obj, flow: DaisugiFlow) {
          const result = await flow.next(`${arg1}2`);

          return `${result}4`;
        }

        b.meta = { withFlow: true };

        async function c(arg1: string) {
          return `${arg1}3`;
        }

        const result = await sequenceOf([a, b, c])(0);

        assert.strictEqual(result, '012345');
      });

      it('composing', async () => {
        const sequenceOf = createSequenceOf();

        const obj1 = { sum: 0 };

        async function a(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}1`;

          await flow.next();

          arg1.sum = `${arg1.sum}8`;

          return arg1;
        }

        a.meta = { withFlow: true };

        async function b(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}2`;

          await flow.next();

          arg1.sum = `${arg1.sum}5`;

          return arg1;
        }

        b.meta = { withFlow: true };

        async function c(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}3`;

          await flow.next();

          arg1.sum = `${arg1.sum}4`;

          return arg1;
        }

        c.meta = { withFlow: true };

        async function d(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}6`;

          await flow.next();

          arg1.sum = `${arg1.sum}7`;

          return arg1;
        }

        d.meta = { withFlow: true };

        const result = await sequenceOf([
          a,
          sequenceOf([b, c]),
          d,
        ])(obj1);

        assert.strictEqual(obj1.sum, '012345678');
        assert.strictEqual(result.sum, '012345678');
      });
    });

    describe('synchronous/asynchronous', () => {
      it('composing', async () => {
        const sequenceOf = createSequenceOf();

        const obj1 = { sum: 0 };

        async function a(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}1`;

          await flow.next();

          arg1.sum = `${arg1.sum}8`;

          return arg1;
        }

        a.meta = { withFlow: true };

        function b(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}2`;

          flow.next();

          arg1.sum = `${arg1.sum}5`;

          return arg1;
        }

        b.meta = { withFlow: true };

        async function c(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}3`;

          await flow.next();

          arg1.sum = `${arg1.sum}4`;

          return arg1;
        }

        c.meta = { withFlow: true };

        function d(arg1: Obj, flow: DaisugiFlow) {
          arg1.sum = `${arg1.sum}6`;

          flow.next();

          arg1.sum = `${arg1.sum}7`;

          return arg1;
        }

        d.meta = { withFlow: true };

        const result = await sequenceOf([
          a,
          sequenceOf([b, c]),
          d,
        ])(obj1);

        // Mixing sync and async handlers in a cascade does NOT preserve the
        // strict LIFO upstream order that the fully-async case yields
        // ('012345678'). A sync handler cannot `await` its async downstream, so
        // `b` (sync) returns after writing `5` while its async downstream `c`
        // is still suspended on `await flow.next()`. The synchronous cascade
        // (`5`,`6`,`7`) therefore completes before `c`'s upstream half (`4`)
        // resumes on a later microtask, which itself runs before `a`'s awaited
        // upstream (`8`). The resulting order is deterministic; make every
        // handler async if strict cascade ordering is required.
        assert.strictEqual(obj1.sum, '012356748');
        assert.strictEqual(result.sum, '012356748');
      });
    });
  });
});

describe('decorator', () => {
  it('basic', () => {
    function decorator(handler: DaisugiHandler) {
      return (arg1: string) => {
        return `${handler(arg1)}x`;
      };
    }

    const sequenceOf = createSequenceOf([decorator]);

    function a(arg1: string) {
      return `${arg1}1`;
    }

    function b(arg1: string) {
      return `${arg1}2`;
    }

    const result = sequenceOf([a, b])(0);

    assert.strictEqual(result, '01x2x');
  });

  it('synchronous/asynchronous', () => {
    function decorator(handler: DaisugiHandler) {
      return (arg1: Obj, flow: DaisugiFlow) => {
        arg1.sum = `${arg1.sum}x`;

        handler(arg1, flow);

        arg1.sum = `${arg1.sum}y`;
      };
    }

    const sequenceOf = createSequenceOf([decorator]);

    const obj1 = { sum: 0 };

    function a(arg1: Obj, flow: DaisugiFlow) {
      arg1.sum = `${arg1.sum}1`;

      flow.next();

      arg1.sum = `${arg1.sum}6`;
    }

    a.meta = { withFlow: true };

    function b(arg1: Obj, flow: DaisugiFlow) {
      arg1.sum = `${arg1.sum}2`;

      flow.next();

      arg1.sum = `${arg1.sum}5`;
    }

    b.meta = { withFlow: true };

    function c(arg1: Obj, flow: DaisugiFlow) {
      arg1.sum = `${arg1.sum}3`;

      flow.next();

      arg1.sum = `${arg1.sum}4`;
    }

    c.meta = { withFlow: true };

    sequenceOf([a, b, c])(obj1);

    assert.strictEqual(obj1.sum, '0x1x2x34y5y6y');
  });

  it('extend flow', () => {
    function decorator(handler: DaisugiHandler) {
      return (arg1: Obj, flow: DaisugiFlow) => {
        flow['extended'] = (arg2: Obj) => {
          arg2.sum = `${arg2.sum}x`;
          flow.next();
        };

        handler(arg1, flow);
      };
    }

    const sequenceOf = createSequenceOf([decorator]);

    const obj1 = { sum: 0 };

    function a(arg1: Obj, flow: DaisugiFlow) {
      arg1.sum = `${arg1.sum}1`;

      flow['extended'](arg1);
    }

    a.meta = { withFlow: true };

    function b(arg1: Obj, flow: DaisugiFlow) {
      arg1.sum = `${arg1.sum}2`;

      flow['extended'](arg1);
    }

    b.meta = { withFlow: true };

    function c(arg1: Obj, flow: DaisugiFlow) {
      arg1.sum = `${arg1.sum}3`;

      flow['extended'](arg1);
    }

    c.meta = { withFlow: true };

    sequenceOf([a, b, c])(obj1);

    assert.strictEqual(obj1.sum, '01x2x3x');
  });

  it('use meta', () => {
    function decorator1(handler: DaisugiHandler) {
      return (arg1: Obj, flow: DaisugiFlow) => {
        // @ts-expect-error: meta.arg is dynamically set and not in the type
        arg1.sum = `${arg1.sum}${handler.meta.arg}`;

        handler(arg1, flow);
      };
    }

    function decorator2(handler: DaisugiHandler) {
      return (arg1: Obj, flow: DaisugiFlow) => {
        // @ts-expect-error: meta.arg is dynamically set and not in the type
        arg1.sum = `${arg1.sum}${handler.meta.arg}-`;

        handler(arg1, flow);
      };
    }

    const sequenceOf = createSequenceOf([
      decorator1,
      decorator2,
    ]);

    const obj1 = { sum: 0 };

    function a(arg1: Obj, flow: DaisugiFlow) {
      arg1.sum = `${arg1.sum}1`;

      flow.next();
    }

    a.meta = { withFlow: true, arg: 'x' };

    function b(arg1: Obj, flow: DaisugiFlow) {
      arg1.sum = `${arg1.sum}2`;

      flow.next();
    }

    b.meta = { withFlow: true, arg: 'y' };

    sequenceOf([a, b])(obj1);

    assert.strictEqual(obj1.sum, '0x-x1y-y2');
  });
});
