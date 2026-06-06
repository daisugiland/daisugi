import {
  type AnzenResultFailure,
  Result,
} from '@daisugi/anzen';

import {
  PrettyStack,
  type PrettyStackOpts,
} from './pretty_stack.js';

type ValueOf<T> = T[keyof T];
type Entries<T> = [keyof T, ValueOf<T>][];

export interface AyamariGlobalOpts<CustomErrCode> {
  levelValue?: number;
  injectStack?: boolean;
  customErrCode?: CustomErrCode;
}

export interface AyamariOpts {
  cause?: AyamariErr | Error;
  meta?: unknown;
  injectStack?: boolean;
  levelValue?: number;
}

export interface AyamariErr {
  name: string;
  message: string;
  code: number;
  stack: string;
  cause: AyamariErr | Error | null | undefined;
  levelValue: number;
  createdAt: string;
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
  static level = {
    off: 100,
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10,
  };
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
  #levelValue: number;

  constructor(opts: AyamariGlobalOpts<CustomErrCode> = {}) {
    this.#injectStack = opts.injectStack ?? false;
    this.#levelValue =
      opts.levelValue ?? Ayamari.level.info;
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
        levelValue: opts.levelValue ?? this.#levelValue,
        createdAt: new Date().toISOString(),
      } as AyamariErr;
      if (opts.injectStack ?? this.#injectStack) {
        Error.captureStackTrace(err, createErr);
      }
      return err;
    };
    return createErr;
  }

  propagateErr(msg: string, opts: AyamariOpts) {
    const errName = this.#errName.get(
      (opts.cause as AyamariErr).code,
    )!;
    return this.errFn[errName](msg, opts);
  }

  propagateErrRes(msg: string, opts: AyamariOpts) {
    return Result.failure(this.propagateErr(msg, opts));
  }

  static readonly #DEFAULT_PRETTIFY_OPTS: PrettyStackOpts =
    { color: true };

  static prettifyStack(
    err: AyamariErr | Error,
    opts = Ayamari.#DEFAULT_PRETTIFY_OPTS,
  ) {
    return PrettyStack.print(err, opts);
  }
}
