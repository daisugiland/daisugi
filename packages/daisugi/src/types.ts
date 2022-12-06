import type { ResultFailure } from '@daisugi/anzen';
import { Code } from '@daisugi/kintsugi';

export interface DaisugiToolkit {
  next: any;
  nextWith(...args: any): any;
  failWith(arg: any): ResultFailure<DaisugiFailException>;
  [key: string]: any;
}

export interface DaisugiHandlerDecorator {
  (
    userHandler: DaisugiHandler,
    toolkit: DaisugiToolkit,
  ): DaisugiHandler;
}

interface DaisugiHandlerMeta {
  name?: string;
  injectToolkit?: boolean;
  [key: string]: any;
}

interface DaisugiPrivateHandlerMeta {
  isAsync: boolean;
}

export interface DaisugiHandler {
  (...args: any): any;
  meta?: DaisugiHandlerMeta;
  __meta__?: DaisugiPrivateHandlerMeta;
}

export interface DaisugiStopPropagationException {
  code: Code.StopPropagation;
  value: any;
}

export interface DaisugiFailException {
  code: Code.Fail;
  value: any;
}
