import { ResultFail, Code } from '@daisugi/kintsugi';

export interface Toolkit {
  next: any;
  nextWith(...args: any): any;
  failWith(arg: any): ResultFail<FailException>;
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
  code: Code.StopPropagation;
  value: any;
}

export interface FailException {
  code: Code.Fail;
  value: any;
}
