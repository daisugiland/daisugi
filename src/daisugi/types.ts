export interface Toolkit {
  next: any;
  nextWith(...args: any): any;
  abort: AbortException;
  abortWith(result: any): AbortException;
  stopPropagationWith(result: any): StopException;
  jumpTo(name: string, ...args: any): JumpException;
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
  shouldBeTreatAsAsync?: boolean;
}

export interface Handler {
  (...args: any): any;
  meta?: HandlerMeta;
  __meta__?: PrivateHandlerMeta;
}

export interface AbortException {
  code: 'DAISUGI:ABORT';
  result: any;
}

export interface StopException {
  code: 'DAISUGI:STOP_PROPAGATION';
  result: any;
}

interface JumpException {
  code: 'DAISUGI:JUMP';
  args: any[];
  userHandler: Handler;
}

export type Exception =
  | Error
  | AbortException
  | JumpException;

export type HandlersByName = Record<string, Handler>;
