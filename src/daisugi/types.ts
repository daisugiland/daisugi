export interface Toolkit {
  next: any;
  nextWith(...args: any): any;
  failWith(arg: any): ResultFail<FailException>;
  // abort: AbortException;
  // abortWith(value: any): AbortException;
  // stopPropagationWith(value: any): StopPropagationException;
  // jumpTo(name: string, ...args: any): JumpException;
}

export interface HandlerDecorator {
  (userHandler: Handler, toolkit: Toolkit): Handler;
}

interface HandlerMeta {
  name?: string;
  injectToolkit?: boolean;
}

interface PrivateHandlerMeta {
  isAsync: boolean;
}

export interface Handler {
  (...args: any): any;
  meta?: HandlerMeta;
  __meta__?: PrivateHandlerMeta;
}

/*
export interface AbortException {
  code: 'DAISUGI:ABORT';
  value: any;
}
*/

export interface StopPropagationException {
  code: 'DAISUGI:STOP_PROPAGATION';
  value: any;
}

export interface FailException {
  code: 'DAISUGI:FAIL';
  error: any;
}

/*
interface JumpException {
  code: 'DAISUGI:JUMP';
  args: any[];
  userHandler: Handler;
}
*/

/*
export type Exception =
  | Error
  | AbortException
  | JumpException;
*/

export interface Result<T, E> {
  isSuccess: boolean;
  isFailure: boolean;
  value: T;
  error: E;
}

export interface ResultFactory {
  ok(value: any): Result<any, null>;
  fail(error: any): Result<null, any>;
}

// export type HandlersByName = Record<string, Handler>;
