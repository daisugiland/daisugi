import {
  AbortException,
  Exception,
  Handler,
  HandlerDecorator,
  HandlersByName,
  StopException,
  Toolkit,
} from './types';

/*
export { Handler as Handler };
export { HandlerDecorator as HandlerDecorator };
*/

export { Toolkit as Toolkit };

// duck type validation.
function isFnAsync(handler: Handler) {
  return handler.constructor.name === 'AsyncFunction';
}

const abortExceptionCode = 'DAISUGI:ABORT';
const jumpExceptionCode = 'DAISUGI:JUMP';
const stopExceptionCode = 'DAISUGI:STOP';

// duck type error. use for short-circuit.
export function abortWith(result): AbortException {
  throw { code: abortExceptionCode, result };
}

// duck type error.
export function stopWith(result): StopException {
  return { code: stopExceptionCode, result };
}

function captureException(error: Exception) {
  // @ts-ignore
  if (error.code === abortExceptionCode) {
    // @ts-ignore
    return error.result;
  }

  // @ts-ignore
  if (error.code === jumpExceptionCode) {
    // @ts-ignore
    return error.handler(...error.args);
  }

  throw error;
}

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
    // Stop pipe.
    if (args[0]?.code === stopExceptionCode) {
      return args[0].result;
    }

    const nextHandler = handlers[nextHandlerIndex];

    if (injectToolkit) {
      // Add runtime `toolkit` properties whose depend of the arguments.
      if (!toolkit.hasOwnProperty('next')) {
        Object.defineProperty(toolkit, 'next', {
          get() {
            return toolkit.nextWith(...args);
          },
        });

        Object.defineProperty(toolkit, 'abort', {
          get() {
            toolkit.abortWith(args[0]);
          },
        });
      }

      return decoratedUserHandler(...args, toolkit);
    }

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

function createPipeline(
  userHandlerDecorators: HandlerDecorator[],
) {
  const globalHandlersByName: HandlersByName = {};

  return function () {
    const handlers: Handler[] = [];

    function add(userHandler: Handler[]) {
      // TODO Experiment with right reduce for faster pipes.
      userHandler.forEach((userHandler) => {
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

  function compose(userHandlers: Handler[]): Handler {
    const { add, handlers } = pipeline();

    add(userHandlers);

    return decorateWithExceptionCapture(handlers[0]);
  }

  function sequenceOf(userHandlers: Handler[]): Handler {
    const { add, handlers } = pipeline();

    add(userHandlers);

    return handlers[0];
  }

  return {
    compose,
    sequenceOf,
  };
}
