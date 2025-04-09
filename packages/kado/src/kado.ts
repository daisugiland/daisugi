import { Ayamari } from '@daisugi/ayamari';
import { urandom } from '@daisugi/kintsugi';

const { errFn } = new Ayamari();

interface ClassConstructor {
  new (...args: any[]): unknown;
}
export type KadoToken = string | symbol | number;
export type KadoScope = 'Transient' | 'Singleton';
export interface KadoManifestItem {
  token?: KadoToken;
  useClass?: ClassConstructor;
  useValue?: any;
  useFnByContainer?: (container: KadoContainer) => any;
  useFn?: (...args: any[]) => any;
  params?: KadoParam[];
  scope?: KadoScope;
  meta?: Record<string, any>;
}
export type KadoParam = KadoToken | KadoManifestItem;
interface KadoContainerItem {
  manifestItem: KadoManifestItem;
  isCircularChecked: boolean;
  instance: any;
}
type KadoTokenToContainerItem = Map<
  KadoToken,
  KadoContainerItem
>;
export type KadoContainer = Container;

export class Container {
  #tokenToContainerItem: KadoTokenToContainerItem =
    new Map();

  resolve = async <T>(token: KadoToken): Promise<T> => {
    const containerItem =
      this.#tokenToContainerItem.get(token);
    if (!containerItem) {
      throw errFn.NotFound(
        `Attempted to resolve unregistered dependency token: "${token.toString()}".`,
      );
    }
    const { manifestItem } = containerItem;
    if (manifestItem.useValue !== undefined)
      return manifestItem.useValue;
    if (containerItem.instance)
      return containerItem.instance;
    let resolve: ((value: any) => void) | undefined;
    const isSingleton =
      manifestItem.scope !== Kado.scope.Transient;
    if (isSingleton) {
      containerItem.instance = new Promise((_resolve) => {
        resolve = _resolve;
      });
    }
    let paramsInstances = null;
    if (manifestItem.params) {
      this.#checkForCircularDep(containerItem);
      paramsInstances = await Promise.all(
        manifestItem.params.map(this.#resolveParam),
      );
    }
    let instance: any;
    if (manifestItem.useFn) {
      instance = paramsInstances
        ? manifestItem.useFn(...paramsInstances)
        : manifestItem.useFn();
    } else if (manifestItem.useFnByContainer) {
      instance = manifestItem.useFnByContainer(this);
    } else if (manifestItem.useClass) {
      instance = paramsInstances
        ? new manifestItem.useClass(...paramsInstances)
        : new manifestItem.useClass();
    } else {
      throw errFn.NotFound(
        `No instantiation strategy found for token: "${token.toString()}".`,
      );
    }
    if (!isSingleton) return instance;
    if (!resolve) {
      throw errFn.UnexpectedError(
        `Missing resolve handler for singleton token: "${token.toString()}".`,
      );
    }
    resolve(instance);
    return containerItem.instance;
  };

  #resolveParam = async (param: KadoParam) => {
    return this.resolve(
      typeof param === 'object'
        ? this.#registerItem(param)
        : param,
    );
  };

  register = (manifestItems: KadoManifestItem[]) => {
    for (const manifestItem of manifestItems) {
      this.#registerItem(manifestItem);
    }
  };

  #registerItem = (
    manifestItem: KadoManifestItem,
  ): KadoToken => {
    const token = manifestItem.token || urandom();
    this.#tokenToContainerItem.set(token, {
      manifestItem: Object.assign(manifestItem, { token }),
      isCircularChecked: false,
      instance: null,
    });
    return token;
  };

  list = (): KadoManifestItem[] => {
    return Array.from(
      this.#tokenToContainerItem.values(),
      (containerItem) => containerItem.manifestItem,
    );
  };

  get = (token: KadoToken): KadoManifestItem => {
    const containerItem =
      this.#tokenToContainerItem.get(token);
    if (containerItem === undefined) {
      throw errFn.NotFound(
        `Attempted to get unregistered dependency token: "${token.toString()}".`,
      );
    }
    return containerItem.manifestItem;
  };

  #checkForCircularDep = (
    containerItem: KadoContainerItem,
    visitedTokens: KadoToken[] = [],
  ) => {
    if (containerItem.isCircularChecked) return;
    const token = containerItem.manifestItem.token;
    if (!token) return;
    if (visitedTokens.includes(token)) {
      const chainOfTokens = visitedTokens
        .map((token) => `"${token.toString()}"`)
        .join(' ➡️ ');
      throw errFn.CircularDependencyDetected(
        `Attempted to resolve circular dependency: ${chainOfTokens} 🔄 "${token.toString()}".`,
      );
    }
    const params = containerItem.manifestItem.params;
    if (!params) return;
    for (const param of params) {
      if (typeof param === 'object') continue;
      const paramContainerItem =
        this.#tokenToContainerItem.get(param);
      if (!paramContainerItem) continue;
      this.#checkForCircularDep(paramContainerItem, [
        ...visitedTokens,
        token,
      ]);
      paramContainerItem.isCircularChecked = true;
    }
  };
}

export class Kado {
  static scope: Record<KadoScope, KadoScope> = {
    Transient: 'Transient',
    Singleton: 'Singleton',
  };

  container: KadoContainer = new Container();

  static value = (value: unknown): KadoManifestItem => ({
    useValue: value,
  });

  static map = (params: KadoParam[]): KadoManifestItem => ({
    useFn: (...args: unknown[]) => args,
    params,
  });

  static flatMap = (
    params: KadoParam[],
  ): KadoManifestItem => ({
    useFn: (...args: unknown[]) => args.flat(),
    params,
  });
}
