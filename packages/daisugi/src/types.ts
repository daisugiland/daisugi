import type { AnzenResultErr } from '@daisugi/anzen';

// Symbol brand for Daisugi's private, per-handler metadata. Keyed by a Symbol
// (not a `__meta__` string) so it never collides with user keys and never
// shows up in enumeration or spreads.
export const handlerMetaKey: unique symbol = Symbol(
  'daisugi.handlerMeta',
);

export interface DaisugiFlow<Return = any> {
  // Run the rest of the sequence and return its result. Called with no
  // arguments it reuses the current handler's arguments; pass arguments to
  // forward different ones downstream.
  next(...args: any[]): Return;
  failWith(value: unknown): AnzenResultErr<Error>;
  // Decorators may attach their own helpers to the flow.
  [key: string]: any;
}

export type DaisugiHandlerDecorator = (
  handler: DaisugiHandler,
  flow: DaisugiFlow,
) => DaisugiHandler;

interface DaisugiHandlerMeta {
  name?: string;
  // Opt the handler into cascading flow: receive the `flow` object as the last
  // argument.
  withFlow?: boolean;
  // Override automatic async detection (which relies on `constructor.name`).
  // Set to `true` for transpiled or wrapped handlers that return a Promise.
  isAsync?: boolean;
  [key: string]: any;
}

interface DaisugiPrivateHandlerMeta {
  isAsync: boolean;
}

// `Args` / `Return` default to `any` so existing untyped usage keeps working,
// while callers that want inference can pin them, e.g.
// `DaisugiHandler<[Request], Response>`.
export interface DaisugiHandler<
  Args extends any[] = any[],
  Return = any,
> {
  (...args: Args): Return;
  meta?: DaisugiHandlerMeta;
  [handlerMetaKey]?: DaisugiPrivateHandlerMeta;
}
