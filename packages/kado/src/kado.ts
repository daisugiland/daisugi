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
  useFactoryWithContainer?(container: Container): any;
  useFactory?: Fn;
  params?: Token[];
  scope?: 'Transient' | 'Singleton';
}

interface KadoItem {
  manifestItem: ManifestItem;
  isCircularDependencyChecked: boolean;
  instance: any;
}

type TokenToKadoItem = Record<Token, KadoItem>;

class Kado {
  private tokenToKadoItem: TokenToKadoItem;

  constructor() {
    this.tokenToKadoItem = Object.create(null);
  }

  resolve(token: Token) {
    const kadoItem = this.tokenToKadoItem[token];

    if (!kadoItem) {
      throw new CustomError(
        `Attempted to resolve unregistered dependency token: "${token.toString()}".`,
        Code.NotFound,
      );
    }

    const manifestItem = kadoItem.manifestItem;

    if (manifestItem.useValue !== undefined) {
      return manifestItem.useValue;
    }

    if (kadoItem.instance) {
      return kadoItem.instance;
    }

    let paramsInstances = null;

    if (manifestItem.params) {
      this.checkForCircularDependency(kadoItem);

      paramsInstances = manifestItem.params.map((param) =>
        this.resolve(param),
      );
    }

    let instance;

    if (manifestItem.useFactory) {
      instance = paramsInstances
        ? manifestItem.useFactory(...paramsInstances)
        : manifestItem.useFactory();

      if (manifestItem.scope === 'Transient') {
        return instance;
      }
    }

    if (manifestItem.useFactoryWithContainer) {
      instance = manifestItem.useFactoryWithContainer(this);

      if (manifestItem.scope === 'Transient') {
        return instance;
      }
    }

    if (manifestItem.useClass) {
      instance = paramsInstances
        ? new manifestItem.useClass(...paramsInstances)
        : new manifestItem.useClass();

      if (manifestItem.scope === 'Transient') {
        return instance;
      }
    }

    kadoItem.instance = instance;

    return instance;
  }

  register(manifest: ManifestItem[]) {
    manifest.forEach((manifestItem) => {
      this.tokenToKadoItem[manifestItem.token] = {
        manifestItem,
        isCircularDependencyChecked: false,
        instance: null,
      };
    });
  }

  list(): ManifestItem[] {
    return Object.values(this.tokenToKadoItem).map(
      (kadoItem) => kadoItem.manifestItem,
    );
  }

  private checkForCircularDependency(
    kadoItem: KadoItem,
    tokens: Token[] = [],
  ) {
    if (kadoItem.isCircularDependencyChecked) {
      return;
    }

    const token = kadoItem.manifestItem.token;

    if (tokens.includes(token)) {
      const chainOfTokens = tokens
        .map((token) => `"${token.toString()}"`)
        .join(' ➡️ ');

      throw new CustomError(
        `Attempted to resolve circular dependency: ${chainOfTokens} 🔄 "${token.toString()}".`,
        Code.CircularDependencyDetected,
      );
    }

    if (kadoItem.manifestItem.params) {
      kadoItem.manifestItem.params.forEach((param) => {
        const paramKadoItem = this.tokenToKadoItem[param];

        if (!paramKadoItem) {
          return;
        }

        this.checkForCircularDependency(paramKadoItem, [
          ...tokens,
          token,
        ]);

        paramKadoItem.isCircularDependencyChecked = true;
      });
    }
  }
}

export function kado() {
  return {
    container: new Kado(),
  };
}
