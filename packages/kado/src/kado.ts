export type KadoToken = string | symbol | number;
export type KadoScope =
  | 'Transient'
  | 'Singleton'
  | 'ContainerScoped';

// Minimal error-factory surface Kado depends on. The factory only has
// to return an `Error`; a richer error (e.g. an `@daisugi/ayamari` one
// carrying a `code`, `cause` and prettified stack) is equally accepted,
// since it is also an `Error`. `@daisugi/ayamari`'s `errFn` satisfies
// this shape and can be injected directly; otherwise the built-in
// `defaultErrFn` is used, keeping Kado free of any required dependency.
export interface KadoErrFn {
  NotFound(msg: string): Error;
  CircularDependencyDetected(msg: string): Error;
}

export interface KadoOpts {
  errFn?: KadoErrFn;
}

// Built-in fallback used when no `errFn` is injected. It mirrors the
// observable contract of the matching `@daisugi/ayamari` errors (same
// `name` and `code`), so the default behaves like Ayamari without
// requiring it. The `code` is not part of the `KadoErrFn` contract,
// so an injected factory may still return plain native `Error`s.
const defaultErrFn: KadoErrFn = {
  NotFound: (msg) =>
    Object.assign(new Error(msg), {
      name: 'NotFound [404]',
      code: 404,
    }),
  CircularDependencyDetected: (msg) =>
    Object.assign(new Error(msg), {
      name: 'CircularDependencyDetected [578]',
      code: 578,
    }),
};

export interface KadoManifestItem<
  Args extends readonly any[] = any[],
> {
  token?: KadoToken;
  useClass?: new (...args: Args) => unknown;
  useValue?: any;
  useFnByContainer?(container: KadoContainer): any;
  useFn?(...args: Args): any;
  params?: ParamsFor<Args>;
  scope?: KadoScope;
  meta?: Record<string, any>;
}
export type KadoParam = KadoToken | KadoManifestItem;

// Properties shared by every inline-provider param shape, kept apart so
// each `KadoParamOf` member stays a structural `KadoManifestItem`. Its
// `params` must mirror `KadoManifestItem.params` exactly (same element
// type) so the two remain mutually assignable.
interface ParamCommon {
  token?: KadoToken;
  params?: KadoParamOf<any>[];
  scope?: KadoScope;
  meta?: Record<string, any>;
}

// A single param slot. Either a bare token (an unchecked escape hatch:
// the token's resolved type can't be recovered from its value) or an
// inline provider whose *resolved* value must be assignable to `T`.
export type KadoParamOf<T> =
  | KadoToken
  | (ParamCommon & { useValue: T })
  | (ParamCommon & { useFn(...args: any[]): T })
  | (ParamCommon & {
      useFnByContainer(container: KadoContainer): T;
    })
  | (ParamCommon & { useClass: new (...args: any[]) => T });

// Maps a provider's argument tuple to the matching tuple of param
// slots. Homomorphic over `Args`, so a tuple stays a tuple (preserving
// arity checks) and `any[]` collapses to the loose `KadoParamOf<any>[]`.
export type ParamsFor<Args extends readonly any[]> = {
  [K in keyof Args]: KadoParamOf<Args[K]>;
};

// Per-item validator used by `register`: when an item provides a
// `useClass`, its constructor argument tuple is inferred and `params`
// is re-typed against it. Every other item (including `useFn`, whose
// runtime accepts a param count that need not match its arity) passes
// through unchanged, preserving Kado's existing loose semantics.
type ValidateManifestItems<Items extends readonly any[]> = {
  [I in keyof Items]: Items[I] extends {
    useClass: new (...args: infer A) => any;
  }
    ? KadoManifestItem<A> & { useClass: Items[I]['useClass'] }
    : Items[I];
};
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
  // Token lookup falls through to the parent when not found
  // locally; `null` for a root container. Passed through the
  // constructor's optional `parent`, which only
  // `createChildContainer` is meant to supply.
  #parent: Container | null;
  // Error factory used for thrown errors. Defaults to a built-in
  // implementation; an `@daisugi/ayamari` `errFn` (or any compatible
  // factory) can be injected via `Kado`'s config and is propagated to
  // child containers.
  #errFn: KadoErrFn;

  constructor(
    parent: Container | null = null,
    errFn: KadoErrFn = defaultErrFn,
  ) {
    this.#tokenToContainerItem = new Map();
    this.#parent = parent;
    this.#errFn = errFn;
  }

  // Creates a container whose token lookup falls through to this
  // one (and its ancestors) when a token is not registered
  // locally. `ContainerScoped` registrations are copied down so
  // each child caches its own instance instead of sharing the
  // ancestor's.
  createChildContainer(): Container {
    const child = new Container(this, this.#errFn);
    for (const [
      token,
      containerItem,
    ] of this.#tokenToContainerItem) {
      if (
        containerItem.manifestItem.scope ===
        Kado.scope.ContainerScoped
      ) {
        child.#tokenToContainerItem.set(token, {
          ...containerItem,
          validatedGeneration: -1,
          instance: null,
        });
      }
    }
    return child;
  }

  async resolve<T>(token: KadoToken): Promise<T> {
    const containerItem =
      this.#tokenToContainerItem.get(token);
    if (containerItem === undefined) {
      // Not registered locally: fall through to the ancestor
      // chain. The matching ancestor becomes the resolving
      // container, so its singletons cache there and are shared,
      // while `ContainerScoped` items were already copied down to
      // this container by `createChildContainer`.
      if (this.#parent !== null) {
        return this.#parent.resolve<T>(token);
      }
      throw this.#errFn.NotFound(
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

  #resolveParam(param: KadoParamOf<any>) {
    const token =
      typeof param === 'object'
        ? this.#registerItem(param)
        : param;
    return this.resolve(token);
  }

  register<
    Items extends readonly KadoManifestItem<any>[],
  >(manifestItems: ValidateManifestItems<Items>) {
    for (const manifestItem of manifestItems as readonly KadoManifestItem[]) {
      this.#registerItem(manifestItem);
    }
    // Newly registered items may introduce cycles through tokens
    // that were already validated, so invalidate prior validations.
    this.#generation++;
  }

  #registerItem(manifestItem: KadoManifestItem): KadoToken {
    const token =
      manifestItem.token ?? globalThis.crypto.randomUUID();
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
    // Merge the whole chain. A nearer container shadows its
    // ancestors, so the first registration seen for a token wins
    // (this also dedupes the `ContainerScoped` copies that
    // `createChildContainer` placed in descendants).
    const manifestItemByToken = new Map<
      KadoToken,
      KadoManifestItem
    >();
    this.#collectManifestItems(manifestItemByToken);
    return Array.from(manifestItemByToken.values());
  }

  #collectManifestItems(
    manifestItemByToken: Map<KadoToken, KadoManifestItem>,
  ): void {
    for (const containerItem of this.#tokenToContainerItem.values()) {
      const token = containerItem.manifestItem.token!;
      if (!manifestItemByToken.has(token)) {
        manifestItemByToken.set(
          token,
          containerItem.manifestItem,
        );
      }
    }
    if (this.#parent !== null) {
      this.#parent.#collectManifestItems(
        manifestItemByToken,
      );
    }
  }

  get(token: KadoToken): KadoManifestItem {
    const containerItem =
      this.#tokenToContainerItem.get(token);
    if (containerItem !== undefined) {
      return containerItem.manifestItem;
    }
    // Not registered locally: fall through to the ancestor chain,
    // mirroring `resolve`.
    if (this.#parent !== null) {
      return this.#parent.get(token);
    }
    throw this.#errFn.NotFound(
      `Attempted to get unregistered dependency token: "${token.toString()}".`,
    );
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
      throw this.#errFn.CircularDependencyDetected(
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
        // A param may live in an ancestor; validate it against
        // its owner so each container memoizes with its own
        // generation. Cycles can't span back down the chain
        // (ancestors can't see descendant tokens), so walking up
        // is sufficient.
        this.#checkTokenForCircularDep(param, path);
      }
      path.delete(token);
    }
    containerItem.validatedGeneration = this.#generation;
  }

  // Locates `token` along the ancestor chain and runs the cycle
  // check on the container that owns it, so the validation
  // memoizes against that container's own generation.
  #checkTokenForCircularDep(
    token: KadoToken,
    path: Set<KadoToken>,
  ): void {
    const containerItem =
      this.#tokenToContainerItem.get(token);
    if (containerItem !== undefined) {
      this.#checkForCircularDep(containerItem, path);
      return;
    }
    if (this.#parent !== null) {
      this.#parent.#checkTokenForCircularDep(token, path);
    }
  }
}

export class Kado {
  static scope: Record<KadoScope, KadoScope> = {
    Transient: 'Transient',
    Singleton: 'Singleton',
    ContainerScoped: 'ContainerScoped',
  };
  container: KadoContainer;

  constructor(opts: KadoOpts = {}) {
    this.container = new Container(null, opts.errFn);
  }

  // Generic so the value type is preserved: `Kado.value('x')` yields a
  // param assignable to `KadoParamOf<string>`. The returned object keeps
  // `useValue` required (unlike `KadoManifestItem`), so it matches the
  // corresponding `KadoParamOf` member when used as a param.
  static value<T>(value: T): ParamCommon & { useValue: T } {
    return { useValue: value };
  }

  // `map`/`flatMap` resolve to an array, so their resolved type can't
  // match an arbitrary param slot precisely; `useFn` returns `any` so
  // the result stays usable in any typed param position.
  static map(
    params: KadoParamOf<any>[],
  ): ParamCommon & { useFn(...args: any[]): any } {
    return {
      useFn(...args: unknown[]) {
        return args;
      },
      params,
    };
  }

  static flatMap(
    params: KadoParamOf<any>[],
  ): ParamCommon & { useFn(...args: any[]): any } {
    return {
      useFn(...args: unknown[]) {
        return args.flat();
      },
      params,
    };
  }
}
