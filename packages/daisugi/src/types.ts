import { ResultFail, Code } from '@daisugi/kintsugi';

export interface Toolkit {
  next: any;
  nextWith(...args: any): any;
  failWith(arg: any): ResultFail<FailException>;
  [key: string]: any;
}

export interface HandlerDecorator {
  (userHandler: Handler, toolkit: Toolkit): Handler;
}

interface HandlerMeta {
  name?: string;
  injectToolkit?: boolean;
  [key: string]: any;
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
