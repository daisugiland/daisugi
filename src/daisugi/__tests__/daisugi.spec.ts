import {
  daisugi,
  // abortWith,
  failWith,
  stopPropagationWith,
  Toolkit,
} from '../daisugi';

describe('sequenceOf ', () => {
  describe('downstream', () => {
    describe('synchronous', () => {
      it('basic', () => {
        const { sequenceOf } = daisugi();

        function a(arg1) {
          return `${arg1}1`;
        }

        function b(arg1) {
          return `${arg1}2`;
        }

        function c(arg1) {
          return `${arg1}3`;
        }

        const result = sequenceOf([a, b, c])(0);

        expect(result).toBe('0123');
      });

      /*
      it('abortWith', () => {
        const { entrySequenceOf } = daisugi();

        function a(arg1) {
          return `${arg1}1`;
        }

        function b(arg1) {
          abortWith(arg1);

          return `${arg1}2`;
        }

        const result = entrySequenceOf([a, b])(0);

        expect(result).toBe('01');
      });
      */

      it('composing', () => {
        const { sequenceOf } = daisugi();

        function a(arg1) {
          return `${arg1}1`;
        }

        function b(arg1) {
          return `${arg1}2`;
        }

        function c(arg1) {
          return `${arg1}3`;
        }

        function d(arg1) {
          return `${arg1}4`;
        }

        const result = sequenceOf([
          a,
          sequenceOf([b, c]),
          d,
        ])(0);

        expect(result).toBe('01234');
      });

      it('stopPropagationWith', () => {
        const { sequenceOf } = daisugi();

        function a(arg1) {
          return `${arg1}1`;
        }

        function b(arg1) {
          return stopPropagationWith(`${arg1}2`);
        }

        function c(arg1) {
          return `${arg1}3`;
        }

        const result = sequenceOf([a, b, c])(0);

        expect(result).toBe('012');
      });

      it('failWith', () => {
        const { sequenceOf } = daisugi();

        function a(arg1) {
          return `${arg1}1`;
        }

        function b(arg1) {
          return failWith(`${arg1}2`);
        }

        function c(arg1) {
          return `${arg1}3`;
        }

        const result = sequenceOf([
          a,
          sequenceOf([b, c]),
          c,
        ])(0);

        expect(result.error.value).toBe('012');
      });
    });

    describe('asynchronous', () => {
      it('basic', async () => {
        const { sequenceOf } = daisugi();

        async function a(arg1) {
          return `${arg1}1`;
        }

        async function b(arg1) {
          return `${arg1}2`;
        }

        async function c(arg1) {
          return `${arg1}3`;
        }

        const result = await sequenceOf([a, b, c])(0);

        expect(result).toBe('0123');
      });
    });
  });

  describe('downstream/upstream', () => {
    describe('synchronous', () => {
      it('failWith', () => {
        const { sequenceOf } = daisugi();

        const obj1 = {
          sum: 0,
        };

        function a(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          toolkit.next;

          arg1.sum = `${arg1.sum}5`;

          return arg1;
        }

        a.meta = {
          injectToolkit: true,
        };

        function b(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}2`;

          return toolkit.failWith(arg1);
        }

        b.meta = {
          injectToolkit: true,
        };

        function c(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}3`;

          toolkit.next;

          arg1.sum = `${arg1.sum}4`;

          return arg1;
        }

        c.meta = {
          injectToolkit: true,
        };

        const result = sequenceOf([
          a,
          sequenceOf([b, c]),
          c,
        ])(obj1);

        expect(result.sum).toBe('0125');
      });

      it('next with multiple arguments', () => {
        const { sequenceOf } = daisugi();

        const obj1 = {
          sum: 0,
        };

        const obj2 = {
          sum: 0,
        };

        function a(arg1, arg2, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;
          arg2.sum = `${arg2.sum}1`;

          toolkit.next;

          arg1.sum = `${arg1.sum}6`;
        }

        a.meta = {
          injectToolkit: true,
        };

        function b(arg1, arg2, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}2`;
          arg2.sum = `${arg2.sum}2`;

          toolkit.next;

          arg1.sum = `${arg1.sum}5`;
        }

        b.meta = {
          injectToolkit: true,
        };

        function c(arg1, arg2, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}3`;
          arg2.sum = `${arg2.sum}3`;

          toolkit.next;

          arg1.sum = `${arg1.sum}4`;
        }

        c.meta = {
          injectToolkit: true,
        };

        sequenceOf([a, b, c])(obj1, obj2);

        expect(obj1.sum).toBe('0123456');
        expect(obj2.sum).toBe('0123');
      });

      it('nextWith', () => {
        const { sequenceOf } = daisugi();

        function a(arg1, toolkit: Toolkit) {
          const result = toolkit.nextWith(`${arg1}1`);

          return `${result}5`;
        }

        a.meta = {
          injectToolkit: true,
        };

        function b(arg1, toolkit: Toolkit) {
          const result = toolkit.nextWith(`${arg1}2`);

          return `${result}4`;
        }

        b.meta = {
          injectToolkit: true,
        };

        function c(arg1) {
          return `${arg1}3`;
        }

        const result = sequenceOf([a, b, c])(0);

        expect(result).toBe('012345');
      });

      it('nextWith with multiple arguments', () => {
        const { sequenceOf } = daisugi();

        function a(arg1, arg2, toolkit: Toolkit) {
          const result = toolkit.nextWith(
            `${arg1}${arg2}`,
            2,
          );

          return `${result}6`;
        }

        a.meta = {
          injectToolkit: true,
        };

        function b(arg1, arg2, toolkit: Toolkit) {
          const result = toolkit.nextWith(
            `${arg1}${arg2}`,
            3,
          );

          return `${result}5`;
        }

        b.meta = {
          injectToolkit: true,
        };

        function c(arg1, arg2) {
          return `${arg1}${arg2}4`;
        }

        const result = sequenceOf([a, b, c])(0, 1);

        expect(result).toBe('0123456');
      });

      /*
      it('abort', () => {
        const { entrySequenceOf } = daisugi();

        const obj1 = {
          sum: 0,
        };

        function a(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          toolkit.next;

          arg1.sum = `${arg1.sum}4`;
        }

        a.meta = {
          injectToolkit: true,
        };

        function b(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}2`;

          toolkit.abort;

          arg1.sum = `${arg1.sum}3`;
        }

        b.meta = {
          injectToolkit: true,
        };

        const result = entrySequenceOf([a, b])(obj1);

        expect(obj1.sum).toBe('012');
        expect(result.sum).toBe('012');
      });

      it('abortWith', () => {
        const { entrySequenceOf } = daisugi();

        const obj1 = {
          sum: 0,
        };

        function a(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          toolkit.next;

          arg1.sum = `${arg1.sum}4`;
        }

        a.meta = {
          injectToolkit: true,
        };

        function b(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}2`;

          toolkit.abortWith(arg1.sum);

          arg1.sum = `${arg1.sum}3`;
        }

        b.meta = {
          injectToolkit: true,
        };

        const result = entrySequenceOf([a, b])(obj1);

        expect(result).toBe('012');
      });
      */

      it('multiple calls', () => {
        const { sequenceOf } = daisugi();

        function a(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          toolkit.next;

          return arg1;
        }

        a.meta = {
          injectToolkit: true,
        };

        function b(arg1) {
          arg1.sum = `${arg1.sum}2`;

          return arg1;
        }

        const handler = sequenceOf([a, b]);

        expect(handler({ sum: 0 }).sum).toBe('012');
        expect(handler({ sum: 0 }).sum).toBe('012');
      });
    });

    describe('asynchronous', () => {
      const { sequenceOf } = daisugi();

      it('next', async () => {
        const obj1 = {
          sum: 0,
        };

        async function a(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}6`;
        }

        a.meta = {
          injectToolkit: true,
        };

        async function b(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}2`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}5`;
        }

        b.meta = {
          injectToolkit: true,
        };

        async function c(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}3`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}4`;
        }

        c.meta = {
          injectToolkit: true,
        };

        await sequenceOf([a, b, c])(obj1);

        expect(obj1.sum).toBe('0123456');
      });

      it('nextWith', async () => {
        async function a(arg1, toolkit: Toolkit) {
          const result = await toolkit.nextWith(`${arg1}1`);

          return `${result}5`;
        }

        a.meta = {
          injectToolkit: true,
        };

        async function b(arg1, toolkit: Toolkit) {
          const result = await toolkit.nextWith(`${arg1}2`);

          return `${result}4`;
        }

        b.meta = {
          injectToolkit: true,
        };

        async function c(arg1) {
          return `${arg1}3`;
        }

        const result = await sequenceOf([a, b, c])(0);

        expect(result).toBe('012345');
      });

      it('composing', async () => {
        const { sequenceOf } = daisugi();

        const obj1 = {
          sum: 0,
        };

        async function a(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}8`;

          return arg1;
        }

        a.meta = {
          injectToolkit: true,
        };

        async function b(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}2`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}5`;

          return arg1;
        }

        b.meta = {
          injectToolkit: true,
        };

        async function c(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}3`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}4`;

          return arg1;
        }

        c.meta = {
          injectToolkit: true,
        };

        async function d(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}6`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}7`;

          return arg1;
        }

        d.meta = {
          injectToolkit: true,
        };

        const result = await sequenceOf([
          a,
          sequenceOf([b, c]),
          d,
        ])(obj1);

        expect(obj1.sum).toBe('012345678');
        expect(result.sum).toBe('012345678');
      });

      /*
      it('composing with abort', async () => {
        const { entrySequenceOf, sequenceOf } = daisugi();

        const obj1 = {
          sum: 0,
        };

        async function a(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}7`;

          return arg1;
        }

        a.meta = {
          injectToolkit: true,
        };

        async function b(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}2`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}5`;

          return arg1;
        }

        b.meta = {
          injectToolkit: true,
        };

        async function c(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}3`;

          toolkit.abort;

          arg1.sum = `${arg1.sum}4`;

          return arg1;
        }

        c.meta = {
          injectToolkit: true,
        };

        function d(arg1) {
          arg1.sum = `${arg1.sum}6`;

          return arg1;
        }

        const result = await entrySequenceOf([
          a,
          sequenceOf([b, c]),
          d,
        ])(obj1);

        expect(obj1.sum).toBe('0123');
        expect(result.sum).toBe('0123');
      });

      it('jumpTo', async () => {
        const { entrySequenceOf, sequenceOf } = daisugi();

        const obj1 = {
          sum: 0,
        };

        async function a(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}10`;

          return arg1;
        }

        a.meta = {
          injectToolkit: true,
        };

        async function b(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}2`;

          await toolkit.jumpTo('d', arg1);

          arg1.sum = `${arg1.sum}9`;

          return arg1;
        }

        b.meta = {
          injectToolkit: true,
        };

        async function c(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}3`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}8`;

          return arg1;
        }

        c.meta = {
          injectToolkit: true,
        };

        async function d(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}4`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}7`;

          return arg1;
        }

        d.meta = {
          injectToolkit: true,
          name: 'd',
        };

        async function e(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}5`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}6`;

          return arg1;
        }

        e.meta = {
          injectToolkit: true,
        };

        const result = await entrySequenceOf([
          a,
          sequenceOf([b, c]),
          d,
          e,
        ])(obj1);

        expect(obj1.sum).toBe('0124567');
        expect(result.sum).toBe('0124567');
      });

      it('multiple jumpTo', async () => {
        const { entrySequenceOf, sequenceOf } = daisugi();

        const obj1 = {
          sum: 0,
        };

        async function a(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}12`;

          return arg1;
        }

        a.meta = {
          injectToolkit: true,
        };

        async function b(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}2`;

          await toolkit.jumpTo('d', arg1);

          arg1.sum = `${arg1.sum}11`;

          return arg1;
        }

        b.meta = {
          injectToolkit: true,
        };

        async function c(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}3`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}10`;

          return arg1;
        }

        c.meta = {
          injectToolkit: true,
        };

        async function d(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}4`;

          await toolkit.jumpTo('f', arg1);

          arg1.sum = `${arg1.sum}9`;

          return arg1;
        }

        d.meta = {
          injectToolkit: true,
          name: 'd',
        };

        async function e(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}5`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}8`;

          return arg1;
        }

        e.meta = {
          injectToolkit: true,
        };

        async function f(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}6`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}7`;

          return arg1;
        }

        f.meta = {
          injectToolkit: true,
          name: 'f',
        };

        const result = await entrySequenceOf([
          a,
          sequenceOf([b, c]),
          d,
          e,
          f,
        ])(obj1);

        expect(obj1.sum).toBe('012467');
        expect(result.sum).toBe('012467');
      });
      */
    });

    describe('synchronous/asynchronous', () => {
      it('composing', async () => {
        const { sequenceOf } = daisugi();

        const obj1 = {
          sum: 0,
        };

        async function a(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}1`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}8`;

          return arg1;
        }

        a.meta = {
          injectToolkit: true,
        };

        function b(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}2`;

          toolkit.next;

          arg1.sum = `${arg1.sum}5`;

          return arg1;
        }

        b.meta = {
          injectToolkit: true,
        };

        async function c(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}3`;

          await toolkit.next;

          arg1.sum = `${arg1.sum}4`;

          return arg1;
        }

        c.meta = {
          injectToolkit: true,
        };

        function d(arg1, toolkit: Toolkit) {
          arg1.sum = `${arg1.sum}6`;

          toolkit.next;

          arg1.sum = `${arg1.sum}7`;

          return arg1;
        }

        d.meta = {
          injectToolkit: true,
        };

        const result = await sequenceOf([
          a,
          sequenceOf([b, c]),
          d,
        ])(obj1);

        // TODO Need to be reviewed.
        expect(obj1.sum).toBe('012356748');
        expect(result.sum).toBe('012356748');
      });
    });
  });
});

describe('decorator', () => {
  it('basic', () => {
    function decorator(handler) {
      return (arg1) => {
        return `${handler(arg1)}x`;
      };
    }

    const { sequenceOf } = daisugi([decorator]);

    function a(arg1) {
      return `${arg1}1`;
    }

    function b(arg1) {
      return `${arg1}2`;
    }

    const result = sequenceOf([a, b])(0);

    expect(result).toBe('01x2x');
  });

  it('synchronous/asynchronous', () => {
    function decorator(handler) {
      return function (arg1, toolkit: Toolkit) {
        arg1.sum = `${arg1.sum}x`;

        handler(arg1, toolkit);

        arg1.sum = `${arg1.sum}y`;
      };
    }

    const { sequenceOf } = daisugi([decorator]);

    const obj1 = {
      sum: 0,
    };

    function a(arg1, toolkit: Toolkit) {
      arg1.sum = `${arg1.sum}1`;

      toolkit.next;

      arg1.sum = `${arg1.sum}6`;
    }

    a.meta = {
      injectToolkit: true,
    };

    function b(arg1, toolkit: Toolkit) {
      arg1.sum = `${arg1.sum}2`;

      toolkit.next;

      arg1.sum = `${arg1.sum}5`;
    }

    b.meta = {
      injectToolkit: true,
    };

    function c(arg1, toolkit: Toolkit) {
      arg1.sum = `${arg1.sum}3`;

      toolkit.next;

      arg1.sum = `${arg1.sum}4`;
    }

    c.meta = {
      injectToolkit: true,
    };

    sequenceOf([a, b, c])(obj1);

    expect(obj1.sum).toBe('0x1x2x34y5y6y');
  });

  it('extend toolkit', () => {
    function decorator(handler, toolkit) {
      toolkit.extended = (arg1) => {
        arg1.sum = `${arg1.sum}x`;
        toolkit.next;
      };

      return function (arg1, toolkit: Toolkit) {
        handler(arg1, toolkit);
      };
    }

    const { sequenceOf } = daisugi([decorator]);

    const obj1 = {
      sum: 0,
    };

    function a(arg1, toolkit) {
      arg1.sum = `${arg1.sum}1`;

      toolkit.extended(arg1);
    }

    a.meta = {
      injectToolkit: true,
    };

    function b(arg1, toolkit) {
      arg1.sum = `${arg1.sum}2`;

      toolkit.extended(arg1);
    }

    b.meta = {
      injectToolkit: true,
    };

    function c(arg1, toolkit) {
      arg1.sum = `${arg1.sum}3`;

      toolkit.extended(arg1);
    }

    c.meta = {
      injectToolkit: true,
    };

    sequenceOf([a, b, c])(obj1);

    expect(obj1.sum).toBe('01x2x3x');
  });

  it('use meta', () => {
    function decorator1(handler) {
      return function (arg1, toolkit: Toolkit) {
        arg1.sum = `${arg1.sum}${handler.meta.arg}`;

        handler(arg1, toolkit);
      };
    }

    function decorator2(handler) {
      return function (arg1, toolkit: Toolkit) {
        arg1.sum = `${arg1.sum}${handler.meta.arg}-`;

        handler(arg1, toolkit);
      };
    }

    const { sequenceOf } = daisugi([
      decorator1,
      decorator2,
    ]);

    const obj1 = {
      sum: 0,
    };

    function a(arg1, toolkit: Toolkit) {
      arg1.sum = `${arg1.sum}1`;

      toolkit.next;
    }

    a.meta = {
      injectToolkit: true,
      arg: 'x',
    };

    function b(arg1, toolkit: Toolkit) {
      arg1.sum = `${arg1.sum}2`;

      toolkit.next;
    }

    b.meta = {
      injectToolkit: true,
      arg: 'y',
    };

    sequenceOf([a, b])(obj1);

    expect(obj1.sum).toBe('0x-x1y-y2');
  });
});

describe('daisugi', () => {
  /*
  it('uniq instance', () => {
    const { entrySequenceOf, sequenceOf } = daisugi();

    function a(arg1, toolkit: Toolkit) {
      toolkit.jumpTo('b', `${arg1}1`);
    }

    a.meta = {
      injectToolkit: true,
    };

    function b(arg1) {
      return `${arg1}2`;
    }

    b.meta = {
      name: 'b',
    };

    sequenceOf([b]);
    const result1 = entrySequenceOf([a])(0);

    expect(result1).toBe('012');
  });

  it('multiple instances', () => {
    const { sequenceOf } = daisugi();
    const { entrySequenceOf } = daisugi();

    function a(arg1, toolkit: Toolkit) {
      toolkit.jumpTo('b', `${arg1}1`);
    }

    a.meta = {
      injectToolkit: true,
    };

    function b(arg1) {
      return `${arg1}2`;
    }

    b.meta = {
      name: 'b',
    };

    sequenceOf([b]);

    try {
      entrySequenceOf([a])(0);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
  */
});
