import { Ayamari } from '@daisugi/ayamari';
import { urandom } from '@daisugi/kintsugi';

const { errFn } = new Ayamari();

interface Class {
  new (...args: any[]): void;
}
export type KadoToken = string | symbol | number;
export type KadoScope = 'Transient' | 'Singleton';
export interface KadoManifestItem {
  token?: KadoToken;
  useClass?: Class;
  useValue?: any;
  useFnByContainer?(container: KadoContainer): any;
  useFn?(...args: any[]): any;
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

  async resolve<T>(token: KadoToken): Promise<T> {
    const containerItem =
      this.#tokenToContainerItem.get(token);
    if (containerItem === undefined) {
      throw errFn.NotFound(
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
      paramsInstances = await Promise.all(
        manifestItem.params.map(
          this.#resolveParam.bind(this),
        ),
      );
    }
    let instance;
    if (manifestItem.useFn) {
      instance = paramsInstances
        ? await manifestItem.useFn(...paramsInstances)
        : await manifestItem.useFn();
    } else if (manifestItem.useFnByContainer) {
      instance = await manifestItem.useFnByContainer(this);
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

  async #resolveParam(param: KadoParam) {
    const token =
      typeof param === 'object'
        ? this.#registerItem(param)
        : param;
    return this.resolve(token);
  }

  register(manifestItems: KadoManifestItem[]) {
    for (const manifestItem of manifestItems) {
      this.#registerItem(manifestItem);
    }
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
      throw errFn.NotFound(
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
      throw errFn.CircularDependencyDetected(
        `Attempted to resolve circular dependency: ${chainOfTokens} 🔄 "${token.toString()}".`,
      );
    }
    if (containerItem.manifestItem.params) {
      for (const param of containerItem.manifestItem
        .params) {
        if (typeof param === 'object') {
          continue;
        }
        const paramContainerItem =
          this.#tokenToContainerItem.get(param);
        if (!paramContainerItem) {
          continue;
        }
        this.#checkForCircularDep(paramContainerItem, [
          ...tokens,
          token,
        ]);
        paramContainerItem.checkedForCircularDep = true;
      }
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
      useFn(...args: unknown[]) {
        return args;
      },
      params,
    };
  }

  static flatMap(params: KadoParam[]): KadoManifestItem {
    return {
      useFn(...args: unknown[]) {
        return args.flat();
      },
      params,
    };
  }
}
