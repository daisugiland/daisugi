import {
  type AnzenResultFailure,
  Result,
} from '@daisugi/anzen';

import {
  DEFAULT_FRAME_FILTER,
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
  code: number;
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
  static readonly DEFAULT_FRAME_FILTER =
    DEFAULT_FRAME_FILTER;
  static errCode = {
    CircuitSuspended: 572,
    CircularDependencyDetected: 578,
    Fail: 575,
    InvalidArgument: 576,
    NotFound: 404,
    StopPropagation: 574,
    Timeout: 504,
    UnexpectedError: 571,
    ValidationFailed: 577,
  };
  errCode = Ayamari.errCode;
  errFn = new Map() as Record<
    AyamariErrCodeKey<CustomErrCode>,
    AyamariCreateErr
  >;
  errFnRes = new Map() as Record<
    AyamariErrCodeKey<CustomErrCode>,
    AyamariCreateErrRes
  >;
  #errName = new Map<
    number,
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
      Record<AyamariErrCodeKey<CustomErrCode>, number>
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
    errCode: number,
  ) {
    const name = `${errName as string} [${errCode}]`;
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
