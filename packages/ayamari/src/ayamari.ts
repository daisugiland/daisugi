import { PrettyStack } from './pretty_stack.js';

export interface AyamariGlobalOpts<T> {
  levelValue?: number;
  injectStack?: boolean;
  color?: boolean;
  customNameToErrCode?: T;
}

export interface AyamariOpts {
  cause?: AyamariErr | Error;
  data?: unknown;
  injectStack?: boolean;
  levelValue?: number;
  color?: boolean;
}

export interface AyamariErr {
  name: string;
  message: string;
  code: AyamariErrCode;
  stack: string;
  cause: AyamariErr | Error | null | undefined;
  levelValue: number;
  prettyStack(): string;
  createdAt: string;
  data: any;
}

export type AyamariErrName =
  keyof typeof Ayamari['errCode'];
export type AyamariErrCode = number;
export type AyamariErrFn<T> = Record<
  keyof T | AyamariErrName,
  ReturnType<typeof Ayamari.prototype.createErrCreator>
>;
export type AyamariErrNameToErrCode<T> = Record<
  keyof T | AyamariErrName,
  AyamariErrCode
>;

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
  errFn: AyamariErrFn<CustomErrCode>;
  #injectStack = false;
  #levelValue = Ayamari.level.info;
  #color: boolean;

  constructor(opts: AyamariGlobalOpts<CustomErrCode> = {}) {
    if (opts.injectStack !== undefined) {
      this.#injectStack = opts.injectStack;
    }
    if (opts.levelValue !== undefined) {
      this.#levelValue = opts.levelValue;
    }
    this.#color = opts.color ?? true;
    if (opts.customNameToErrCode) {
      this.errCode = {
        ...this.errCode,
        ...opts.customNameToErrCode,
      };
    }
    this.errFn = Object.entries(this.errCode).reduce(
      (acc, [errName, errCode]) => {
        acc[errName as keyof AyamariErrFn<CustomErrCode>] =
          this.createErrCreator(errName, errCode);
        return acc;
      },
      {} as AyamariErrFn<CustomErrCode>,
    );
  }

  createErrCreator(
    errName: string,
    errCode: AyamariErrCode,
  ) {
    const name = `${errName} [${errCode}]`;
    const createErr = (
      msg: string,
      opts: AyamariOpts = {},
    ) => {
      const err: AyamariErr = {
        name,
        message: msg,
        code: errCode,
        stack: opts.cause?.stack || 'No stack',
        cause: opts.cause || null,
        data: opts.data ?? null,
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
      return err;
    };
    return createErr;
  }
}
