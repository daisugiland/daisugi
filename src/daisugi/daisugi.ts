import {
  // AbortException,
  // Exception,
  FailException,
  Handler,
  HandlerDecorator,
  HandlersByName,
  Result,
  ResultFail,
  StopPropagationException,
  Toolkit,
} from './types';

/*
export { HandlerDecorator as HandlerDecorator };
*/

export { Handler as Handler };
export { Toolkit as Toolkit };

const result: Result = {
  ok(value) {
    return {
      isSuccess: true,
      isFailure: false,
      value,
      error: null,
    };
  },
  fail(error) {
    return {
      isSuccess: false,
      isFailure: true,
      value: null,
      error,
    };
  },
};

// duck type validation.
function isFnAsync(handler: Handler) {
  return handler.constructor.name === 'AsyncFunction';
}

/*
const abortExceptionCode = 'DAISUGI:ABORT';
const jumpExceptionCode = 'DAISUGI:JUMP';
*/

const STOP_PROPAGATION_EXCEPTION_CODE =
  'DAISUGI:STOP_PROPAGATION';
export const FAIL_EXCEPTION_CODE = 'DAISUGI:FAIL';

// duck type error. use for short-circuit.
/*
export function abortWith(value): AbortException {
  throw { code: abortExceptionCode, value };
}
*/

export function stopPropagationWith(
  value,
): ResultFail<StopPropagationException> {
  return result.fail({
    code: STOP_PROPAGATION_EXCEPTION_CODE,
    value,
  });
}

export function failWith(value): ResultFail<FailException> {
  return result.fail({
    code: FAIL_EXCEPTION_CODE,
    value,
  });
}

/*
function captureException(error: Exception) {
  // @ts-ignore
  if (error.code === abortExceptionCode) {
    // @ts-ignore
    return error.value;
  }

  // @ts-ignore
  if (error.code === jumpExceptionCode) {
    // @ts-ignore
    return error.handler(...error.args);
  }

  throw error;
}
*/

function decorateHandler(
  userHandler: Handler,
  userHandlerDecorators: HandlerDecorator[],
  handlers: Handler[],
  globalHandlersByName: HandlersByName,
): Handler {
  const nextHandlerIndex = handlers.length + 1;
  const isAsync = isFnAsync(userHandler);
  const { injectToolkit, name } = userHandler.meta || {};
  let toolkit: Partial<Toolkit>;

  // Declare `toolkit` variable.
  if (injectToolkit) {
    toolkit = {
      nextWith(...args) {
        const nextHandler = handlers[nextHandlerIndex];

        if (nextHandler) {
          return nextHandler(...args);
        }

        return null;
      },
      failWith,
      /*
      abortWith,
      jumpTo(name, ...args) {
        throw {
          code: jumpExceptionCode,
          handler: decorateWithExceptionCapture(
            globalHandlersByName[name],
          ),
          args,
        };
      },
      */
    };
  }

  const decoratedUserHandler = userHandlerDecorators.reduce(
    (previousHandler, userHandlerDecorator) => {
      const decoratedHandler = userHandlerDecorator(
        previousHandler,
        toolkit as Toolkit,
      );

      decoratedHandler.meta = previousHandler.meta;

      return decoratedHandler;
    },
    userHandler,
  );

  function handler(...args) {
    // Duck type condition, maybe use instanceof and result class here.
    if (args[0]?.isFailure) {
      const firstArg = args[0];

      if (firstArg.error.code === FAIL_EXCEPTION_CODE) {
        return firstArg;
      }

      if (
        firstArg.error.code ===
        STOP_PROPAGATION_EXCEPTION_CODE
      ) {
        return firstArg.error.value;
      }
    }

    if (injectToolkit) {
      // Add runtime `toolkit` properties whose depend of the arguments.
      Object.defineProperty(toolkit, 'next', {
        get() {
          return toolkit.nextWith(...args);
        },
        configurable: true,
      });

      /*
      Object.defineProperty(toolkit, 'abort', {
        get() {
          toolkit.abortWith(args[0]);
        },
        configurable: true,
      });
      */

      return decoratedUserHandler(...args, toolkit);
    }

    const nextHandler = handlers[nextHandlerIndex];

    if (!nextHandler) {
      return decoratedUserHandler(...args);
    }

    if (isAsync) {
      return decoratedUserHandler(...args).then(
        nextHandler,
      );
    }

    if (nextHandler.__meta__.shouldBeTreatAsAsync) {
      return Promise.resolve(
        decoratedUserHandler(...args),
      ).then(nextHandler);
    }

    return nextHandler(decoratedUserHandler(...args));
  }

  if (name) {
    globalHandlersByName[name] = handler;
  }

  handler.__meta__ = {
    isAsync,
    shouldBeTreatAsAsync: isAsync,
  };

  if (isAsync) {
    // Mark all previous handlers as async.
    handlers.forEach((handler) => {
      handler.__meta__.shouldBeTreatAsAsync = isAsync;
    });
  }

  return handler;
}

/*
function decorateWithExceptionCapture(
  handler: Handler,
): Handler {
  return function (...args) {
    // If is async, treat it as async method.
    if (handler.__meta__.isAsync) {
      return handler(...args).catch(captureException);
    }

    if (handler.__meta__.shouldBeTreatAsAsync) {
      return Promise.resolve(handler(...args)).catch(
        captureException,
      );
    }

    // Else treat it as sync method.
    try {
      return handler(...args);
    } catch (error) {
      return captureException(error);
    }
  };
}
*/

function createPipeline(
  userHandlerDecorators: HandlerDecorator[],
) {
  const globalHandlersByName: HandlersByName = {};

  return function () {
    const handlers: Handler[] = [];

    function add(userHandlers: Handler[]) {
      // TODO Experiment with right reduce for faster pipes.
      userHandlers.forEach((userHandler) => {
        handlers.push(
          decorateHandler(
            userHandler,
            userHandlerDecorators,
            handlers,
            globalHandlersByName,
          ),
        );
      });
    }

    return {
      handlers,
      add,
    };
  };
}

export function daisugi(
  userHandlerDecorators: HandlerDecorator[] = [],
) {
  const pipeline = createPipeline(userHandlerDecorators);

  /*
  function entrySequenceOf(
    userHandlers: Handler[],
  ): Handler {
    const { add, handlers } = pipeline();

    add(userHandlers);

    return decorateWithExceptionCapture(handlers[0]);
  }
  */

  function sequenceOf(userHandlers: Handler[]): Handler {
    const { add, handlers } = pipeline();

    add(userHandlers);

    return handlers[0];
  }

  return {
    // entrySequenceOf,
    sequenceOf,
  };
}
