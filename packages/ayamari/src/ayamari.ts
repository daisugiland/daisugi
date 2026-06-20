import {
  type AnzenResultFailure,
  Result,
} from '@daisugi/anzen';

import {
  PrettyStack,
  type PrettyStackOpts,
} from './pretty_stack.js';

// Re-exported so the stack prettifier's option types are reachable from
// the package root. These are type-only (plus the tiny `defaultFrameFilter`
// const); none of them retain `PrettyStack`, so error-only consumers still
// tree-shake `pretty_stack.js` away.
export {
  defaultFrameFilter,
  type FrameFilter,
  type ParsedFrame,
  type PrettyStackOpts,
} from './pretty_stack.js';

type ValueOf<T> = T[keyof T];
type Entries<T> = [keyof T, ValueOf<T>][];

// Registry-global brand stamped on every AyamariErr. `Symbol.for` keeps
// it stable across realms/bundles (and duplicated module copies), so
// `isAyamariErr` works where `instanceof` can't — AyamariErr is a
// plain branded object, not a class instance. The same key is recomputed
// in pretty_stack.ts; keep the two in sync.
const ayamariBrand = Symbol.for('@daisugi/ayamari');

// Pino-style numeric severity levels. Higher = more severe, so
// monitoring can threshold (e.g. alert when `levelValue >= error`).
export const level = {
  off: 100,
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

export const errCode = {
  CircuitSuspended: 'CircuitSuspended',
  CircularDependencyDetected: 'CircularDependencyDetected',
  Fail: 'Fail',
  InvalidArgument: 'InvalidArgument',
  NotFound: 'NotFound',
  StopPropagation: 'StopPropagation',
  Timeout: 'Timeout',
  UnexpectedError: 'UnexpectedError',
  ValidationFailed: 'ValidationFailed',
};

export interface AyamariGlobalOpts<CustomErrCode> {
  injectStack?: boolean;
  customErrCode?: CustomErrCode;
}

export interface AyamariOpts {
  cause?: AyamariErr | Error;
  meta?: unknown;
  injectStack?: boolean;
  levelValue?: number;
}

export interface AyamariErr extends Error {
  name: string;
  message: string;
  code: string;
  levelValue: number;
  stack: string;
  cause: AyamariErr | Error | null | undefined;
  meta: any;
}

// Shared prototype for every AyamariErr. Inheriting the brand and a lazily
// derived `stack` from here (instead of stamping both onto each error) keeps
// instances smaller and skips building `stack` until it is actually read.
// `injectStack` installs an own `stack` via captureStackTrace that shadows
// the getter; the setter lets callers assign `err.stack` directly too.
const ayamariErrProto = Object.create(Error.prototype, {
  [ayamariBrand]: { value: true },
  stack: {
    configurable: true,
    get(this: AyamariErr): string {
      return `${this.name}: ${this.message}`;
    },
    set(this: AyamariErr, value: string): void {
      Object.defineProperty(this, 'stack', {
        value,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    },
  },
}) as object;

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
  | keyof typeof errCode;

export function prettifyStack(
  err: AyamariErr | Error,
  opts: PrettyStackOpts = {},
): string {
  return PrettyStack.print(err, opts);
}

// Brand-based type guard. Reliable across realms/bundles, unlike
// `instanceof` (AyamariErr is a plain branded object, not a class
// instance). Native errors carry their own `code`, so don't duck-type.
export function isAyamariErr(
  err: unknown,
): err is AyamariErr {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as Record<symbol, unknown>)[ayamariBrand] === true
  );
}

// Walk the cause chain (the error itself first) and return the first
// error whose `code` matches, or null. Lets a boundary branch on a
// failure mode no matter how deeply it was wrapped. Reads `code`
// generically, so native errors carrying one (e.g. `ENOENT`) match too.
export function findCauseByCode(
  err: AyamariErr | Error | null | undefined,
  code: string,
): AyamariErr | Error | null {
  // Guard against cyclic cause chains so a malformed error can't hang.
  const seen = new Set<unknown>();
  let cursor: AyamariErr | Error | null | undefined = err;
  while (
    cursor &&
    typeof cursor === 'object' &&
    !seen.has(cursor)
  ) {
    seen.add(cursor);
    if ((cursor as AyamariErr).code === code) {
      return cursor;
    }
    cursor = (cursor as AyamariErr).cause;
  }
  return null;
}

export class Ayamari<CustomErrCode> {
  // Defaults to the module-level `errCode`; `customErrCode` is merged in
  // by the constructor.
  errCode = errCode;
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
    for (const [errName, code] of Object.entries(
      this.errCode,
    ) as Entries<
      Record<AyamariErrCodeKey<CustomErrCode>, string>
    >) {
      this.errFn[errName] = this.createErrCreator(
        errName,
        code,
      );
      this.errFnRes[errName] = this.createErrResCreator(
        this.errFn[errName],
      );
      this.#errName.set(code, errName);
    }
  }

  createErrResCreator(createErr: AyamariCreateErr) {
    return (msg: string, opts: AyamariOpts = {}) => {
      return Result.failure(createErr(msg, opts));
    };
  }

  createErrCreator(
    errName: AyamariErrCodeKey<CustomErrCode>,
    code: string,
  ) {
    const name = errName as string;
    const errorLevel = level.error;
    const createErr = (
      msg: string,
      opts: AyamariOpts = {},
    ) => {
      const err = {
        __proto__: ayamariErrProto,
        name,
        message: msg,
        code,
        levelValue: opts.levelValue ?? errorLevel,
        cause: opts.cause || null,
        meta: opts.meta ?? null,
      } as unknown as AyamariErr;
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
    const cause = opts.cause as AyamariErr;
    const errName =
      this.#errName.get(cause.code) ?? 'UnexpectedError';
    // Carry the cause's severity through so the wrapper matches it
    // (a native Error has none, so fall back to the code's default).
    return this.errFn[errName](msg, {
      ...opts,
      levelValue: opts.levelValue ?? cause.levelValue,
    });
  };

  propagateErrRes = (
    msg: string,
    opts: AyamariOpts & { cause: AyamariErr | Error },
  ) => {
    return Result.failure(this.propagateErr(msg, opts));
  };
}
