import { AppErr, errCode } from '@daisugi/ayamari';
import { urandom } from '@daisugi/kintsugi';

interface Class {
  new (...args: any[]): void;
}
export type KadoToken = string | symbol | number;
export type KadoScope = 'Transient' | 'Singleton';
export interface KadoManifestItem {
  token?: KadoToken;
  useClass?: Class;
  useValue?: any;
  useFactoryByContainer?(container: KadoContainer): any;
  useFactory?(...args: any[]): any;
  params?: KadoParam[];
  scope?: KadoScope;
  meta?: Record<string, any>;
}
export type KadoParam = KadoToken | KadoManifestItem;
interface KadoContainerItem {
  manifestItem: KadoManifestItem;
  checkedForCircularDep: boolean;
  instance: any;
}
type KadoTokenToContainerItem = Map<
  KadoToken,
  KadoContainerItem
>;
export type KadoContainer = Container;

export class Container {
  #tokenToContainerItem: KadoTokenToContainerItem;

  constructor() {
    this.#tokenToContainerItem = new Map();
  }

  resolve<T>(token: KadoToken): T {
    const containerItem =
      this.#tokenToContainerItem.get(token);
    if (containerItem === undefined) {
      throw new AppErr(
        errCode.NotFound,
        `Attempted to resolve unregistered dependency token: "${token.toString()}".`,
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
      paramsInstances = manifestItem.params.map(
        this.#resolveParam.bind(this),
      );
    }
    let instance;
    if (manifestItem.useFactory) {
      instance = paramsInstances
        ? manifestItem.useFactory(...paramsInstances)
        : manifestItem.useFactory();
    } else if (manifestItem.useFactoryByContainer) {
      instance = manifestItem.useFactoryByContainer(this);
    } else if (manifestItem.useClass) {
      instance = paramsInstances
        ? new manifestItem.useClass(...paramsInstances)
        : new manifestItem.useClass();
    }
    if (manifestItem.scope === Kado.scope.Transient) {
      return instance;
    }
    containerItem.instance = instance;
    return instance;
  }

  #resolveParam(param: KadoParam) {
    const token =
      typeof param === 'object'
        ? this.#registerItem(param)
        : param;
    return this.resolve(token);
  }

  register(manifestItems: KadoManifestItem[]) {
    manifestItems.forEach(this.#registerItem.bind(this));
  }

  #registerItem(manifestItem: KadoManifestItem): KadoToken {
    const token = manifestItem.token || urandom();
    this.#tokenToContainerItem.set(token, {
      manifestItem: Object.assign(manifestItem, { token }),
      checkedForCircularDep: false,
      instance: null,
    });
    return token;
  }

  list(): KadoManifestItem[] {
    return Array.from(
      this.#tokenToContainerItem.values(),
    ).map((containerItem) => containerItem.manifestItem);
  }

  get(token: KadoToken): KadoManifestItem {
    const containerItem =
      this.#tokenToContainerItem.get(token);
    if (containerItem === undefined) {
      throw new AppErr(
        errCode.NotFound,
        `Attempted to get unregistered dependency token: "${token.toString()}".`,
      );
    }
    return containerItem.manifestItem;
  }

  #checkForCircularDep(
    containerItem: KadoContainerItem,
    tokens: KadoToken[] = [],
  ) {
    if (containerItem.checkedForCircularDep) {
      return;
    }
    const token = containerItem.manifestItem.token;
    if (!token) {
      return;
    }
    if (tokens.includes(token)) {
      const chainOfTokens = tokens
        .map((token) => `"${token.toString()}"`)
        .join(' ➡️ ');
      throw new AppErr(
        errCode.CircularDependencyDetected,
        `Attempted to resolve circular dependency: ${chainOfTokens} 🔄 "${token.toString()}".`,
      );
    }
    if (containerItem.manifestItem.params) {
      containerItem.manifestItem.params.forEach((param) => {
        if (typeof param === 'object') {
          return;
        }
        const paramContainerItem =
          this.#tokenToContainerItem.get(param);
        if (!paramContainerItem) {
          return;
        }
        this.#checkForCircularDep(paramContainerItem, [
          ...tokens,
          token,
        ]);
        paramContainerItem.checkedForCircularDep = true;
      });
    }
  }
}

export class Kado {
  static scope: Record<KadoScope, KadoScope> = {
    Transient: 'Transient',
    Singleton: 'Singleton',
  };
  container: KadoContainer;

  constructor() {
    this.container = new Container();
  }

  static value(value: unknown): KadoManifestItem {
    return { useValue: value };
  }

  static map(params: KadoParam[]): KadoManifestItem {
    return {
      useFactory(...args: unknown[]) {
        return args;
      },
      params,
    };
  }

  static flatMap(params: KadoParam[]): KadoManifestItem {
    return {
      useFactory(...args: unknown[]) {
        return args.flat();
      },
      params,
    };
  }
}
