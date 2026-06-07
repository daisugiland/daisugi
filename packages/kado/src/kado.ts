import { Ayamari } from '@daisugi/ayamari';
import { urandom } from '@daisugi/kintsugi';

const { errFn } = new Ayamari();

interface Class {
  new (...args: any[]): unknown;
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
// Provider kind, precomputed once at register time so `resolve`
// dispatches on an integer instead of re-probing properties.
const Kind = {
  Value: 0,
  Fn: 1,
  FnByContainer: 2,
  Class: 3,
  None: 4,
} as const;
type Kind = (typeof Kind)[keyof typeof Kind];
interface KadoContainerItem {
  manifestItem: KadoManifestItem;
  validatedGeneration: number;
  kind: Kind;
  instance: any;
}
type KadoTokenToContainerItem = Map<
  KadoToken,
  KadoContainerItem
>;
export type KadoContainer = Container;

export class Container {
  #tokenToContainerItem: KadoTokenToContainerItem;
  // Bumped on every `register` to invalidate prior circular-dep
  // validations in O(1) instead of resetting a flag per item.
  #generation = 0;

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
    if (containerItem.kind === Kind.Value) {
      return manifestItem.useValue;
    }
    if (containerItem.instance) {
      return containerItem.instance;
    }
    let resolve: ((value: any) => void) | undefined;
    if (manifestItem.scope !== Kado.scope.Transient) {
      containerItem.instance = new Promise((_resolve) => {
        resolve = _resolve;
      });
    }
    try {
      let paramsInstances: unknown[] | null = null;
      const params = manifestItem.params;
      if (params) {
        this.#checkForCircularDep(containerItem, new Set());
        const promises: Promise<unknown>[] = [];
        for (const param of params) {
          promises.push(this.#resolveParam(param));
        }
        paramsInstances = await Promise.all(promises);
      }
      let instance: any;
      switch (containerItem.kind) {
        case Kind.Fn: {
          instance = paramsInstances
            ? manifestItem.useFn!(...paramsInstances)
            : manifestItem.useFn!();
          break;
        }
        case Kind.FnByContainer: {
          instance = manifestItem.useFnByContainer!(this);
          break;
        }
        case Kind.Class: {
          instance = paramsInstances
            ? new manifestItem.useClass!(...paramsInstances)
            : new manifestItem.useClass!();
          break;
        }
        default:
          break;
      }
      if (manifestItem.scope === Kado.scope.Transient) {
        return instance;
      }
      resolve!(instance);
      return containerItem.instance;
    } catch (error) {
      // Reset the cached pending promise so a failed resolution
      // does not poison future resolves of this token.
      containerItem.instance = null;
      throw error;
    }
  }

  #resolveParam(param: KadoParam) {
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
    // Newly registered items may introduce cycles through tokens
    // that were already validated, so invalidate prior validations.
    this.#generation++;
  }

  #registerItem(manifestItem: KadoManifestItem): KadoToken {
    const token = manifestItem.token ?? urandom();
    let kind: Kind;
    if ('useValue' in manifestItem) {
      kind = Kind.Value;
    } else if (manifestItem.useFn) {
      kind = Kind.Fn;
    } else if (manifestItem.useFnByContainer) {
      kind = Kind.FnByContainer;
    } else if (manifestItem.useClass) {
      kind = Kind.Class;
    } else {
      kind = Kind.None;
    }
    this.#tokenToContainerItem.set(token, {
      manifestItem: { ...manifestItem, token },
      validatedGeneration: -1,
      kind,
      instance: null,
    });
    return token;
  }

  list(): KadoManifestItem[] {
    return Array.from(
      this.#tokenToContainerItem.values(),
      (containerItem) => containerItem.manifestItem,
    );
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
    path: Set<KadoToken>,
  ) {
    // Already proven acyclic since the last `register`; the result
    // is path-independent, so memoize it across the whole traversal.
    if (
      containerItem.validatedGeneration === this.#generation
    ) {
      return;
    }
    const token = containerItem.manifestItem.token;
    if (token === undefined) {
      return;
    }
    if (path.has(token)) {
      const chainOfTokens = Array.from(path)
        .map((t) => `"${t.toString()}"`)
        .join(' ➡️ ');
      throw errFn.CircularDependencyDetected(
        `Attempted to resolve circular dependency: ${chainOfTokens} 🔄 "${token.toString()}".`,
      );
    }
    const params = containerItem.manifestItem.params;
    if (params) {
      path.add(token);
      for (const param of params) {
        if (typeof param === 'object') {
          continue;
        }
        const paramContainerItem =
          this.#tokenToContainerItem.get(param);
        if (paramContainerItem) {
          this.#checkForCircularDep(
            paramContainerItem,
            path,
          );
        }
      }
      path.delete(token);
    }
    containerItem.validatedGeneration = this.#generation;
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
