import { Code, CustomError, urandom } from '@daisugi/kintsugi';

interface Class {
  new (...args: any[]): void;
}
export type Token = string | symbol | number;
export type Scope = 'Transient' | 'Singleton';
export interface ManifestItem {
  token?: Token;
  useClass?: Class;
  useValue?: any;
  useFactoryByContainer?(container: Container): any;
  useFactory?(...args: any[]): any;
  params?: Param[];
  scope?: Scope;
  meta?: Record<string, any>;
}
export type Param = Token | ManifestItem;
interface ContainerItem {
  manifestItem: ManifestItem;
  checkedForCircularDep: boolean;
  instance: any;
}
type TokenToContainerItem = Record<Token, ContainerItem>;

export class Container {
  #tokenToContainerItem: TokenToContainerItem;

  constructor() {
    this.#tokenToContainerItem = Object.create(null);
  }

  resolve<T = any>(token: Token): T {
    const containerItem = this.#tokenToContainerItem[token];
    if (containerItem === undefined) {
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
      this.#checkForCircularDep(containerItem);
      paramsInstances =
        manifestItem.params.map(
          this.#resolveParam.bind(this),
        );
    }
    let instance;
    if (manifestItem.useFactory) {
      instance =
        paramsInstances ? manifestItem.useFactory(
          ...paramsInstances,
        ) : manifestItem.useFactory();
    } else if (manifestItem.useFactoryByContainer) {
      instance = manifestItem.useFactoryByContainer(this);
    } else if (manifestItem.useClass) {
      instance =
        paramsInstances ? new manifestItem.useClass(
          ...paramsInstances,
        ) : new manifestItem.useClass();
    }
    if (manifestItem.scope === Kado.scope.Transient) {
      return instance;
    }
    containerItem.instance = instance;
    return instance;
  }

  #resolveParam(param: Param): any {
    const token = typeof param === 'object' ? this.#registerItem(
      param,
    ) : param;
    return this.resolve(token);
  }

  register(manifest: ManifestItem[]) {
    manifest.forEach(this.#registerItem.bind(this));
  }

  #registerItem(manifestItem: ManifestItem): Token {
    const token = manifestItem.token || urandom();
    this.#tokenToContainerItem[token] =
      {
        manifestItem: Object.assign(manifestItem, { token }),
        checkedForCircularDep: false,
        instance: null,
      };
    return token;
  }

  list(): ManifestItem[] {
    return Object.values(this.#tokenToContainerItem).map(
      (containerItem) => containerItem.manifestItem,
    );
  }

  get(token: Token): ManifestItem {
    return this.#tokenToContainerItem[token]?.manifestItem;
  }

  #checkForCircularDep(
    containerItem: ContainerItem,
    tokens: Token[] = [],
  ) {
    if (containerItem.checkedForCircularDep) {
      return;
    }
    const token = containerItem.manifestItem.token;
    if (!token) {
      return;
    }
    if (tokens.includes(token)) {
      const chainOfTokens = tokens.map(
        (token) => `"${token.toString()}"`,
      ).join(' ➡️ ');
      throw new CustomError(
        `Attempted to resolve circular dependency: ${chainOfTokens} 🔄 "${token.toString()}".`,
        Code.CircularDependencyDetected,
      );
    }
    if (containerItem.manifestItem.params) {
      containerItem.manifestItem.params.forEach((param) => {
        if (typeof param === 'object') {
          return;
        }
        const paramContainerItem = this.#tokenToContainerItem[param];
        if (!paramContainerItem) {
          return;
        }
        this.#checkForCircularDep(
          paramContainerItem,
          [...tokens, token],
        );
        paramContainerItem.checkedForCircularDep = true;
      });
    }
  }
}

export class Kado {
  static scope: Record<Scope, Scope> = {
    Transient: 'Transient',
    Singleton: 'Singleton',
  };
  container: Container;

  constructor() {
    this.container = new Container();
  }

  static value(value: any): ManifestItem {
    return { useValue: value };
  }

  static map(params: Param[]): ManifestItem {
    return {
      useFactory(...args: any[]) {
        return args;
      },
      params,
    };
  }

  static flatMap(params: Param[]): ManifestItem {
    return {
      useFactory(...args: any[]) {
        return args.flat();
      },
      params,
    };
  }
}
