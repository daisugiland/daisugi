import { Code, CustomError } from '@daisugi/kintsugi';

interface Class {
  new (...args: any[]): any;
}

interface Fn {
  (...args: any[]): any;
}

export type Token = string | symbol;

export interface ManifestItem {
  token: Token;
  useClass?: Class;
  useValue?: any;
  useFactoryWithContainer?(container: Container): any;
  useFactory?: Fn;
  params?: Token[];
  scope?: 'Transient' | 'Singleton';
}

interface ContainerItem {
  manifestItem: ManifestItem;
  isCircularDependencyChecked: boolean;
  instance: any;
}

type TokenToContainerItem = Record<Token, ContainerItem>;

export class Container {
  private tokenToContainerItem: TokenToContainerItem;

  constructor() {
    this.tokenToContainerItem = Object.create(null);
  }

  resolve(token: Token) {
    const containerItem = this.tokenToContainerItem[token];

    if (!containerItem) {
      throw new CustomError(
        `Attempted to resolve unregistered dependency token: "${token.toString()}".`,
        Code.NotFound,
      );
    }

    const manifestItem = containerItem.manifestItem;

    if (manifestItem.useValue !== undefined) {
      return manifestItem.useValue;
    }

    if (containerItem.instance) {
      return containerItem.instance;
    }

    let paramsInstances = null;

    if (manifestItem.params) {
      this.checkForCircularDependency(containerItem);

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

    containerItem.instance = instance;

    return instance;
  }

  register(manifest: ManifestItem[]) {
    manifest.forEach((manifestItem) => {
      this.tokenToContainerItem[manifestItem.token] = {
        manifestItem,
        isCircularDependencyChecked: false,
        instance: null,
      };
    });
  }

  list(): ManifestItem[] {
    return Object.values(this.tokenToContainerItem).map(
      (containerItem) => containerItem.manifestItem,
    );
  }

  private checkForCircularDependency(
    containerItem: ContainerItem,
    tokens: Token[] = [],
  ) {
    if (containerItem.isCircularDependencyChecked) {
      return;
    }

    const token = containerItem.manifestItem.token;

    if (tokens.includes(token)) {
      const chainOfTokens = tokens
        .map((token) => `"${token.toString()}"`)
        .join(' ➡️ ');

      throw new CustomError(
        `Attempted to resolve circular dependency: ${chainOfTokens} 🔄 "${token.toString()}".`,
        Code.CircularDependencyDetected,
      );
    }

    if (containerItem.manifestItem.params) {
      containerItem.manifestItem.params.forEach((param) => {
        const paramContainerItem =
          this.tokenToContainerItem[param];

        if (!paramContainerItem) {
          return;
        }

        this.checkForCircularDependency(
          paramContainerItem,
          [...tokens, token],
        );

        paramContainerItem.isCircularDependencyChecked =
          true;
      });
    }
  }
}

export function kado() {
  return {
    container: new Container(),
  };
}
