import { Code, CustomError } from '@daisugi/kintsugi';

interface Class {
  new (...args: any[]): any;
}

interface Fn {
  (...args: any[]): any;
}

export type Token = string | symbol;

export interface Container {
  resolve(token: Token): any;
  register(manifest: ManifestItem[]): void;
  list(): ManifestItem[];
}

export interface ManifestItem {
  token: Token;
  useClass?: Class;
  useValue?: any;
  useFactory?: (container: Container) => any;
  useFactoryWithParams?: Fn;
  params?: Token[];
  instance?: any;
  scope?: 'Transient' | 'Singleton';
  hasCircularDependency?: boolean;
}

type TokenToManifestItem = Record<Token, ManifestItem>;

class Kado {
  private tokenToManifestItem: TokenToManifestItem;

  constructor() {
    this.tokenToManifestItem = Object.create(null);
  }

  resolve(token: Token) {
    const manifestItem =
      this.tokenToManifestItem[token as string];

    if (!manifestItem) {
      throw new CustomError(
        `Attempted to resolve unregistered dependency token: "${token.toString()}".`,
        Code.NotFound,
      );
    }

    if (manifestItem.useValue) {
      return manifestItem.useValue;
    }

    if (manifestItem.instance) {
      return manifestItem.instance;
    }

    let paramsInstance = null;

    if (manifestItem.params) {
      if (manifestItem.hasCircularDependency !== false) {
        this.checkForCircularDependency(manifestItem);

        manifestItem.hasCircularDependency = false;
      }

      paramsInstance = manifestItem.params.map((param) =>
        this.resolve(param),
      );
    }

    let instance;

    if (manifestItem.useFactoryWithParams) {
      instance = paramsInstance
        ? manifestItem.useFactoryWithParams(
            ...paramsInstance,
          )
        : manifestItem.useFactoryWithParams();

      if (manifestItem.scope === 'Transient') {
        return instance;
      }
    }

    if (manifestItem.useFactory) {
      instance = manifestItem.useFactory(this);

      if (manifestItem.scope === 'Transient') {
        return instance;
      }
    }

    if (manifestItem.useClass) {
      instance = paramsInstance
        ? new manifestItem.useClass(...paramsInstance)
        : new manifestItem.useClass();

      if (manifestItem.scope === 'Transient') {
        return instance;
      }
    }

    manifestItem.instance = instance;

    return instance;
  }

  register(manifest: ManifestItem[]) {
    manifest.forEach((manifestItem) => {
      this.tokenToManifestItem[manifestItem.token] =
        manifestItem;
    });
  }

  list() {
    return Object.values(this.tokenToManifestItem);
  }

  private checkForCircularDependency(
    manifestItem: ManifestItem,
    tokenToTruthy: Record<Token, true> = {},
  ) {
    tokenToTruthy[manifestItem.token] = true;

    manifestItem.params.forEach((token) => {
      if (tokenToTruthy[token]) {
        throw new CustomError(
          `Attempted to resolve circular dependency: "${token.toString()}" of "${manifestItem.token.toString()}" constructor.`,
          Code.FailedDependency,
        );
      }

      tokenToTruthy[token] = true;

      const nextManifestItem =
        this.tokenToManifestItem[token];

      if (nextManifestItem?.params) {
        this.checkForCircularDependency(
          nextManifestItem,
          tokenToTruthy,
        );
      }
    });
  }
}

export function kado() {
  return {
    container: new Kado(),
  };
}
