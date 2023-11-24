import {
  type AnzenResultFailure,
  Result,
} from '@daisugi/anzen';

import { PrettyStack } from './pretty_stack.js';

type ValueOf<T> = T[keyof T];
type Entries<T> = [keyof T, ValueOf<T>][];

export interface AyamariGlobalOpts<CustomErrCode> {
  levelValue?: number;
  injectStack?: boolean;
  color?: boolean;
  customErrCode?: CustomErrCode;
}

export interface AyamariOpts {
  cause?: AyamariErr | Error;
  meta?: unknown;
  injectStack?: boolean;
  levelValue?: number;
  color?: boolean;
}

export interface AyamariErr {
  name: string;
  message: string;
  code: number;
  stack: string;
  cause: AyamariErr | Error | null | undefined;
  levelValue: number;
  prettyStack(): string;
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
  | keyof typeof Ayamari['errCode'];

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export class Ayamari<CustomErrCode = {}> {
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
  #injectStack: boolean;
  #levelValue: number;
  #color: boolean;

  constructor(opts: AyamariGlobalOpts<CustomErrCode> = {}) {
    this.#injectStack = opts.injectStack ?? false;
    this.#levelValue =
      opts.levelValue ?? Ayamari.level.info;
    this.#color = opts.color ?? true;
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
      return this.#createErr(
        msg,
        name,
        errCode,
        createErr,
        opts,
      );
    };
    return createErr;
  }

  #createErr(
    msg: string,
    name: string,
    errCode: number,
    createErr: any,
    opts: AyamariOpts = {},
  ) {
    const err = {
      name,
      message: msg,
      code: errCode,
      stack: `${name}: ${msg}`,
      cause: opts.cause || null,
      meta: opts.meta ?? null,
      levelValue: opts.levelValue ?? this.#levelValue,
      prettyStack: () => {
        return PrettyStack.print(
          err,
          opts.color ?? this.#color,
        );
      },
      createdAt: new Date().toISOString(),
    };
    if (opts.injectStack || this.#injectStack) {
      Error.captureStackTrace(err, createErr);
    }
    return err as AyamariErr;
  }

  propagateErr(msg: string, opts: AyamariOpts) {
    const cause = opts.cause as AyamariErr;
    opts.meta = Object.assign({}, cause.meta, opts.meta);
    return this.#createErr(
      msg,
      cause.name,
      cause.code,
      this.propagateErr,
      opts,
    );
  }

  propagateErrRes(msg: string, opts: AyamariOpts) {
    return Result.failure(this.propagateErr(msg, opts));
  }

  static findCauseByCode(err: AyamariErr, errCode: number) {
    let cause = err;
    while (cause) {
      if (cause.code === errCode) {
        return cause;
      }
      cause = cause.cause as AyamariErr;
    }
    return null;
  }
}
