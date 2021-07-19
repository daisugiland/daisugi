import { Result } from '@daisugi/oumi';

export interface Toolkit {
  next: any;
  nextWith(...args: any): any;
  failWith(arg: any): Result<null, FailException>;
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

export interface StopPropagationException {
  code: 'DAISUGI:STOP_PROPAGATION';
  value: any;
}

export interface FailException {
  code: 'DAISUGI:FAIL';
  error: any;
}
