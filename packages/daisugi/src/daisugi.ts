import { err, isAnzenResult } from '@daisugi/anzen';

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

// Async handlers are detected via `constructor.name`, which only holds for
// native `async function`s. If a handler is transpiled (to ES2015 or lower) or
// wrapped so it loses that constructor, set `handler.meta.isAsync = true` to
// override detection.
function isFnAsync(handler: DaisugiHandler) {
  return (
    handler.meta?.isAsync ??
    handler.constructor.name === 'AsyncFunction'
  );
}

function decorateHandler(
  userHandler: DaisugiHandler,
  userHandlerDecorators: DaisugiHandlerDecorator[],
  nextHandler: DaisugiHandler | null,
  errs: DaisugiErrs,
): DaisugiHandler {
  const isAsync = isFnAsync(userHandler);
  const { injectToolkit } = userHandler.meta || {};
  // Built once per handler and handed to decorators, so a decorator always
  // receives a real toolkit even when the handler doesn't opt in. `nextWith`
  // and `failWith` don't depend on the call arguments, so sharing them is safe;
  // the call-dependent `next` is added per invocation below.
  const toolkit: Partial<DaisugiToolkit> = {
    nextWith(...args) {
      if (nextHandler) {
        return nextHandler(...args);
      }

      return null;
    },
    failWith: (value) => failWith(value, errs),
  };

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
    const firstArg = args[0];
    // Short-circuit on a control-flow Result (failWith / stopPropagationWith).
    if (isAnzenResult(firstArg) && firstArg.isErr) {
      const error = firstArg.unwrapErr() as {
        code: string;
        meta: { value: unknown };
      };
      if (error.code === errCode.Fail) {
        return firstArg;
      }
      if (error.code === errCode.StopPropagation) {
        return error.meta.value;
      }
    }
    if (injectToolkit) {
      // Fresh per-invocation toolkit: `next` is bound to *this* call's args, so
      // concurrent invocations of the same sequence don't clobber each other. It
      // inherits `nextWith` / `failWith` (and any decorator extensions) from the
      // shared base toolkit.
      const callToolkit = Object.create(toolkit, {
        next: {
          configurable: true,
          get() {
            return (toolkit as DaisugiToolkit).nextWith(
              ...args,
            );
          },
        },
      });
      return decoratedUserHandler(...args, callToolkit);
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
