import type { AnzenResultFailure } from '@daisugi/anzen';
import type { AyamariErr } from '@daisugi/ayamari';

export interface DaisugiToolkit {
  next: any;
  nextWith(...args: any): any;
  failWith(arg: any): AnzenResultFailure<AyamariErr>;
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
