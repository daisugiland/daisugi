import { result, Result } from '@daisugi/oumi';

import {
  FailException,
  Handler,
  HandlerDecorator,
  StopPropagationException,
  Toolkit,
} from './types';

export { Handler, Toolkit } from './types';

// duck type validation.
function isFnAsync(handler: Handler) {
  return handler.constructor.name === 'AsyncFunction';
}

const STOP_PROPAGATION_EXCEPTION_CODE =
  'DAISUGI:STOP_PROPAGATION';
export const FAIL_EXCEPTION_CODE = 'DAISUGI:FAIL';

export function stopPropagationWith(
  value,
): Result<null, StopPropagationException> {
  return result.fail({
    code: STOP_PROPAGATION_EXCEPTION_CODE,
    value,
  });
}

export function failWith(
  value,
): Result<null, FailException> {
  return result.fail({
    code: FAIL_EXCEPTION_CODE,
    value,
  });
}

function decorateHandler(
  userHandler: Handler,
  userHandlerDecorators: HandlerDecorator[],
  nextHandler: Handler,
): Handler {
  const isAsync = isFnAsync(userHandler);
  const { injectToolkit } = userHandler.meta || {};
  let toolkit: Partial<Toolkit>;

  // Declare `toolkit` variable.
  if (injectToolkit) {
    toolkit = {
      nextWith(...args) {
        if (nextHandler) {
          return nextHandler(...args);
        }

        return null;
      },
      failWith,
    };
  }

  const decoratedUserHandler = userHandlerDecorators.reduce(
    (currentUserHandler, userHandlerDecorator) => {
      const decoratedHandler = userHandlerDecorator(
        currentUserHandler,
        toolkit as Toolkit,
      );

      decoratedHandler.meta = currentUserHandler.meta;

      return decoratedHandler;
    },
    userHandler,
  );

  // Maybe use of arguments instead.
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

    if (nextHandler.__meta__.isAsync) {
      return Promise.resolve(
        decoratedUserHandler(...args),
      ).then(nextHandler);
    }

    return nextHandler(decoratedUserHandler(...args));
  }

  handler.__meta__ = { isAsync };

  return handler;
}

function createPipeline(
  userHandlerDecorators: HandlerDecorator[],
) {
  return function (userHandlers: Handler[]) {
    return userHandlers.reduceRight(
      (nextHandler, userHandler) => {
        return decorateHandler(
          userHandler,
          userHandlerDecorators,
          nextHandler,
        );
      },
      null,
    );
  };
}

export function daisugi(
  userHandlerDecorators: HandlerDecorator[] = [],
) {
  const pipeline = createPipeline(userHandlerDecorators);

  return {
    sequenceOf: pipeline,
  };
}
