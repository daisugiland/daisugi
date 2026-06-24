import type { AnzenResultErr } from '@daisugi/anzen';

export interface DaisugiToolkit {
  next: any;
  nextWith(...args: any): any;
  failWith(arg: any): AnzenResultErr<Error>;
  [key: string]: any;
}

export type DaisugiHandlerDecorator = (
  userHandler: DaisugiHandler,
  toolkit: DaisugiToolkit,
) => DaisugiHandler;

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
