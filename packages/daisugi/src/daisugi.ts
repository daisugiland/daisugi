import { err } from '@daisugi/anzen';

import type {
  DaisugiHandler,
  DaisugiHandlerDecorator,
  DaisugiToolkit,
} from './types.js';
export type {
  DaisugiHandler,
  DaisugiToolkit,
} from './types.js';

// Error codes the pipeline reacts to. Plain string constants, so the hot path
// compares against them without constructing an error factory on import.
const errCode = {
  Fail: 'Fail',
  StopPropagation: 'StopPropagation',
} as const;

// Minimal error-factory surface Daisugi depends on: each creator need only
// return an `Error` carrying a `meta`, so a richer `@daisugi/ayamari` `errs` can
// be injected directly. Otherwise the built-in `defaultErrs` is used, keeping
// Daisugi free of a hard Ayamari dependency.
export interface DaisugiErrs {
  Fail(msg: string, opts: { meta: any }): Error;
  StopPropagation(msg: string, opts: { meta: any }): Error;
}

export interface DaisugiOpts {
  errs?: DaisugiErrs;
}

// Built-in fallback used when no `errs` is injected. Mirrors the matching
// `@daisugi/ayamari` errors (same `name` and `code`) without requiring it;
// `code` is outside the `DaisugiErrs` contract, so injected factories may omit it.
const defaultErrs: DaisugiErrs = {
  Fail: (msg, opts) =>
    Object.assign(new Error(msg), {
      name: errCode.Fail,
      code: errCode.Fail,
      meta: opts.meta,
    }),
  StopPropagation: (msg, opts) =>
    Object.assign(new Error(msg), {
      name: errCode.StopPropagation,
      code: errCode.StopPropagation,
      meta: opts.meta,
    }),
};

// Duck type validation.
function isFnAsync(handler: DaisugiHandler) {
  return handler.constructor.name === 'AsyncFunction';
}

function decorateHandler(
  userHandler: DaisugiHandler,
  userHandlerDecorators: DaisugiHandlerDecorator[],
  nextHandler: DaisugiHandler | null,
  errs: DaisugiErrs,
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
      failWith: (value) => failWith(value, errs),
    };
  }

  const decoratedUserHandler = userHandlerDecorators.reduce(
    (currentUserHandler, userHandlerDecorator) => {
      const decoratedHandler = userHandlerDecorator(
        currentUserHandler,
        toolkit as DaisugiToolkit,
      );
      if (currentUserHandler.meta !== undefined) {
        decoratedHandler.meta = currentUserHandler.meta;
      }
      return decoratedHandler;
    },
    userHandler,
  );

  // Maybe use of arguments instead.
  function handler(...args: any[]) {
    // Duck type condition, maybe use instanceof and result class here.
    if (args[0]?.isErr) {
      const firstArg = args[0];
      if (firstArg.unwrapErr().code === errCode.Fail) {
        return firstArg;
      }
      if (
        firstArg.unwrapErr().code ===
        errCode.StopPropagation
      ) {
        return firstArg.unwrapErr().meta.value;
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

export function createSequenceOf(
  userHandlerDecorators: DaisugiHandlerDecorator[] = [],
  opts: DaisugiOpts = {},
) {
  const errs = opts.errs ?? defaultErrs;

  return (userHandlers: DaisugiHandler[]) =>
    userHandlers.reduceRight<DaisugiHandler>(
      (nextHandler, userHandler) => {
        return decorateHandler(
          userHandler,
          userHandlerDecorators,
          nextHandler,
          errs,
        );
      },
      null as any as DaisugiHandler,
    );
}

export function stopPropagationWith(
  value: any,
  errs: DaisugiErrs = defaultErrs,
) {
  return err(
    errs.StopPropagation('Daisugi stop propagation.', {
      meta: { value },
    }),
  );
}

export function failWith(
  value: any,
  errs: DaisugiErrs = defaultErrs,
) {
  return err(
    errs.Fail('Daisugi fail.', {
      meta: { value },
    }),
  );
}
