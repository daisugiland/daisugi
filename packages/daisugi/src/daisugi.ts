import { Result } from '@daisugi/anzen';
import { Ayamari } from '@daisugi/ayamari';

import type {
  DaisugiHandler,
  DaisugiHandlerDecorator,
  DaisugiToolkit,
} from './types.js';
export type {
  DaisugiHandler,
  DaisugiToolkit,
} from './types.js';

const { errFn, errCode } = new Ayamari();

// Duck type validation.
function isFnAsync(handler: DaisugiHandler) {
  return handler.constructor.name === 'AsyncFunction';
}

function decorateHandler(
  userHandler: DaisugiHandler,
  userHandlerDecorators: DaisugiHandlerDecorator[],
  nextHandler: DaisugiHandler | null,
): DaisugiHandler {
  const isAsync = isFnAsync(userHandler);
  const { injectToolkit } = userHandler.meta || {};
  let toolkit: Partial<DaisugiToolkit>;
  // Declare `toolkit` variable.
  if (injectToolkit) {
    toolkit = {
      nextWith(...args) {
        if (nextHandler) {
          return nextHandler(...args);
        }

        return null;
      },
      failWith: Daisugi.failWith,
    };
  }

  const decoratedUserHandler = userHandlerDecorators.reduce(
    (currentUserHandler, userHandlerDecorator) => {
      const decoratedHandler = userHandlerDecorator(
        currentUserHandler,
        toolkit as DaisugiToolkit,
      );
      decoratedHandler.meta = currentUserHandler.meta;
      return decoratedHandler;
    },
    userHandler,
  );

  // Maybe use of arguments instead.
  function handler(...args: any[]) {
    // Duck type condition, maybe use instanceof and result class here.
    if (args[0]?.isFailure) {
      const firstArg = args[0];
      if (firstArg.getError().code === errCode.Fail) {
        return firstArg;
      }
      if (
        firstArg.getError().code === errCode.StopPropagation
      ) {
        return firstArg.getError().meta.value;
      }
    }
    if (injectToolkit) {
      // Add runtime `toolkit` properties whose depend of the arguments.
      Object.defineProperty(toolkit, 'next', {
        get() {
          return (toolkit as DaisugiToolkit).nextWith(
            ...args,
          );
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
    if (nextHandler.__meta__?.isAsync) {
      return Promise.resolve(
        decoratedUserHandler(...args),
      ).then(nextHandler);
    }
    return nextHandler(decoratedUserHandler(...args));
  }
  handler.__meta__ = { isAsync };
  return handler;
}

function createSequenceOf(
  userHandlerDecorators: DaisugiHandlerDecorator[],
) {
  return (userHandlers: DaisugiHandler[]) =>
    userHandlers.reduceRight<DaisugiHandler>(
      (nextHandler, userHandler) => {
        return decorateHandler(
          userHandler,
          userHandlerDecorators,
          nextHandler,
        );
      },
      null as any as DaisugiHandler,
    );
}

export class Daisugi {
  sequenceOf;

  constructor(
    userHandlerDecorators: DaisugiHandlerDecorator[] = [],
  ) {
    this.sequenceOf = createSequenceOf(
      userHandlerDecorators,
    );
  }

  static stopPropagationWith(value: any) {
    return Result.failure(
      errFn.StopPropagation('Daisugi stop propagation.', {
        meta: { value },
      }),
    );
  }

  static failWith(value: any) {
    return Result.failure(
      errFn.Fail('Daisugi fail.', {
        meta: { value },
      }),
    );
  }
}
