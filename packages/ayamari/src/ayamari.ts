import {
  type AnzenResultFailure,
  Result,
} from '@daisugi/anzen';

import {
  defaultFrameFilter,
  PrettyStack,
  type PrettyStackOpts,
} from './pretty_stack.js';

type ValueOf<T> = T[keyof T];
type Entries<T> = [keyof T, ValueOf<T>][];

export interface AyamariGlobalOpts<CustomErrCode> {
  injectStack?: boolean;
  customErrCode?: CustomErrCode;
}

export interface AyamariOpts {
  cause?: AyamariErr | Error;
  meta?: unknown;
  injectStack?: boolean;
}

export interface AyamariErr extends Error {
  name: string;
  message: string;
  code: string;
  stack: string;
  cause: AyamariErr | Error | null | undefined;
  meta: any;
}

export type AyamariCreateErr = (
  msg: string,
  opts?: AyamariOpts,
) => AyamariErr;

export type AyamariCreateErrRes = (
  msg: string,
  opts?: AyamariOpts,
) => AnzenResultFailure<AyamariErr>;

export type AyamariErrCodeKey<CustomErrCode> =
  | keyof CustomErrCode
  | keyof (typeof Ayamari)['errCode'];

export class Ayamari<CustomErrCode> {
  static readonly defaultFrameFilter = defaultFrameFilter;
  static errCode = {
    CircuitSuspended: 'CircuitSuspended',
    CircularDependencyDetected:
      'CircularDependencyDetected',
    Fail: 'Fail',
    InvalidArgument: 'InvalidArgument',
    NotFound: 'NotFound',
    StopPropagation: 'StopPropagation',
    Timeout: 'Timeout',
    UnexpectedError: 'UnexpectedError',
    ValidationFailed: 'ValidationFailed',
  };
  errCode = Ayamari.errCode;
  errFn = {} as Record<
    AyamariErrCodeKey<CustomErrCode>,
    AyamariCreateErr
  >;
  errFnRes = {} as Record<
    AyamariErrCodeKey<CustomErrCode>,
    AyamariCreateErrRes
  >;
  #errName = new Map<
    string,
    AyamariErrCodeKey<CustomErrCode>
  >();
  #injectStack: boolean;

  constructor(opts: AyamariGlobalOpts<CustomErrCode> = {}) {
    this.#injectStack = opts.injectStack ?? false;
    if (opts.customErrCode) {
      this.errCode = {
        ...this.errCode,
        ...opts.customErrCode,
      };
    }
    for (const [errName, errCode] of Object.entries(
      this.errCode,
    ) as Entries<
      Record<AyamariErrCodeKey<CustomErrCode>, string>
    >) {
      this.errFn[errName] = this.createErrCreator(
        errName,
        errCode,
      );
      this.errFnRes[errName] = this.createErrResCreator(
        this.errFn[errName],
      );
      this.#errName.set(errCode, errName);
    }
  }

  createErrResCreator(createErr: AyamariCreateErr) {
    return (msg: string, opts: AyamariOpts = {}) => {
      return Result.failure(createErr(msg, opts));
    };
  }

  createErrCreator(
    errName: AyamariErrCodeKey<CustomErrCode>,
    errCode: string,
  ) {
    const name = errName as string;
    const createErr = (
      msg: string,
      opts: AyamariOpts = {},
    ) => {
      const err = {
        __proto__: Error.prototype,
        name,
        message: msg,
        code: errCode,
        stack: `${name}: ${msg}`,
        cause: opts.cause || null,
        meta: opts.meta ?? null,
      } as AyamariErr;
      if (opts.injectStack ?? this.#injectStack) {
        Error.captureStackTrace(err, createErr);
      }
      return err;
    };
    return createErr;
  }

  // Arrow fields so they stay bound to `this` when destructured
  // (e.g. `const { propagateErr } = new Ayamari()`).
  propagateErr = (
    msg: string,
    opts: AyamariOpts & { cause: AyamariErr | Error },
  ) => {
    // Reuse the cause's code when it is a recognized Ayamari error.
    // A native Error (or an unknown code) has no registered name, so
    // fall back to UnexpectedError instead of crashing.
    const code = (opts.cause as AyamariErr).code;
    const errName =
      this.#errName.get(code) ?? 'UnexpectedError';
    return this.errFn[errName](msg, opts);
  };

  propagateErrRes = (
    msg: string,
    opts: AyamariOpts & { cause: AyamariErr | Error },
  ) => {
    return Result.failure(this.propagateErr(msg, opts));
  };

  static prettifyStack(
    err: AyamariErr | Error,
    opts: PrettyStackOpts = {},
  ) {
    return PrettyStack.print(err, opts);
  }
}
