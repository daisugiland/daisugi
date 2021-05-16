export type Toolkit = {
  next: any;
  nextWith(...args: any): any;
  abort: AbortException;
  abortWith(result: any): AbortException;
  jumpTo(name: string, ...args: any): JumpException;
};

export type HandlerDecorator = (
  userHandler: Handler,
  toolkit: Toolkit,
) => Handler;

type HandlerMeta = {
  name?: string;
  injectToolkit?: boolean;
};

type PrivateHandlerMeta = {
  isAsync: boolean;
  treatAsAsync?: boolean;
};

export interface Handler {
  (...args: any): any;
  meta?: HandlerMeta;
  __meta__?: PrivateHandlerMeta;
}

export type AbortException = {
  code: 'DAISUGI:ABORT';
  result: any;
};

type JumpException = {
  code: 'DAISUGI:JUMP';
  args: any[];
  userHandler: Handler;
};

export type Exception =
  | Error
  | AbortException
  | JumpException;

export type DecoratorConfig = {
  shouldBeAsync: boolean;
};

export type HandlersByName = Record<string, Handler>;

export type Config = {
  shouldBeAsync: boolean;
};
