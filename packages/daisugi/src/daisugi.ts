import { err, isAnzenResult } from '@daisugi/anzen';

import {
  handlerMetaKey,
  type DaisugiFlow,
  type DaisugiHandler,
  type DaisugiHandlerDecorator,
} from './types.js';
export type {
  DaisugiFlow,
  DaisugiHandler,
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
  Fail(
    msg: string,
    opts: { meta: { value: unknown } },
  ): Error;
  StopPropagation(
    msg: string,
    opts: { meta: { value: unknown } },
  ): Error;
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
function isAsyncHandler(handler: DaisugiHandler) {
  return (
    handler.meta?.isAsync ??
    handler.constructor.name === 'AsyncFunction'
  );
}

function decorateHandler(
  handler: DaisugiHandler,
  decorators: DaisugiHandlerDecorator[],
  nextHandler: DaisugiHandler | null,
  errs: DaisugiErrs,
): DaisugiHandler {
  const isAsync = isAsyncHandler(handler);
  const { withFlow } = handler.meta || {};
  // Built once per handler and handed to decorators, so a decorator always
  // receives a real flow even when the handler doesn't opt in. `next` (with
  // explicit args) and `failWith` don't depend on the call arguments, so
  // sharing them is safe; a per-invocation `next()` that defaults to the
  // current args is layered on below.
  const flow: Partial<DaisugiFlow> = {
    next(...nextArgs: any[]) {
      if (nextHandler) {
        return nextHandler(...nextArgs);
      }

      return null;
    },
    failWith: (value) => failWith(value, errs),
  };

  const decoratedHandler = decorators.reduce(
    (currentHandler, decorator) => {
      const decorated = decorator(
        currentHandler,
        flow as DaisugiFlow,
      );
      if (currentHandler.meta !== undefined) {
        decorated.meta = currentHandler.meta;
      }
      return decorated;
    },
    handler,
  );

  function composedHandler(...args: any[]) {
    const firstArg = args[0];
    // Short-circuit on a control-flow Result (failWith / stopWith).
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
    if (withFlow) {
      // Fresh per-invocation flow: `next()` is bound to *this* call's args, so
      // concurrent invocations of the same sequence don't clobber each other.
      // It inherits `failWith` (and any decorator extensions) from the shared
      // base flow.
      const callFlow: DaisugiFlow = Object.create(flow);
      callFlow.next = (...nextArgs: any[]) =>
        (flow as DaisugiFlow).next(
          ...(nextArgs.length > 0 ? nextArgs : args),
        );
      return decoratedHandler(...args, callFlow);
    }
    if (!nextHandler) {
      return decoratedHandler(...args);
    }
    if (isAsync) {
      return decoratedHandler(...args).then(nextHandler);
    }
    if (nextHandler[handlerMetaKey]?.isAsync) {
      return Promise.resolve(
        decoratedHandler(...args),
      ).then(nextHandler);
    }
    return nextHandler(decoratedHandler(...args));
  }
  (composedHandler as DaisugiHandler)[handlerMetaKey] = {
    isAsync,
  };
  return composedHandler as DaisugiHandler;
}

export function createSequenceOf(
  decorators: DaisugiHandlerDecorator[] = [],
  opts: DaisugiOpts = {},
) {
  const errs = opts.errs ?? defaultErrs;

  return <Args extends any[] = any[], Return = any>(
    handlers: DaisugiHandler[],
  ): DaisugiHandler<Args, Return> =>
    handlers.reduceRight<DaisugiHandler | null>(
      (nextHandler, handler) =>
        decorateHandler(
          handler,
          decorators,
          nextHandler,
          errs,
        ),
      null,
    ) as DaisugiHandler<Args, Return>;
}

export function stopWith(
  value: unknown,
  errs: DaisugiErrs = defaultErrs,
) {
  return err(
    errs.StopPropagation('Daisugi stop propagation.', {
      meta: { value },
    }),
  );
}

export function failWith(
  value: unknown,
  errs: DaisugiErrs = defaultErrs,
) {
  return err(
    errs.Fail('Daisugi fail.', {
      meta: { value },
    }),
  );
}
