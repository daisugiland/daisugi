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
  useFactory?: (c: Container) => any;
  useFactoryWithParams?: Fn;
  params?: Token[];
  instance?: any;
  scope?: 'Transient' | 'Singleton';
}

type TokenToManifestItem = Record<Token, ManifestItem>;

export function kado() {
  const tokenToManifestItem: TokenToManifestItem =
    Object.create(null);

  return {
    container: {
      resolve(token: Token) {
        const manifestItem =
          tokenToManifestItem[token as string];

        if (manifestItem.useValue) {
          return manifestItem.useValue;
        }

        if (manifestItem.instance) {
          return manifestItem.instance;
        }

        let paramsInstance = null;

        if (manifestItem.params) {
          paramsInstance = manifestItem.params.map(
            (param) => this.resolve(param),
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
      },
      register(manifest: ManifestItem[]) {
        manifest.forEach((manifestItem) => {
          tokenToManifestItem[
            manifestItem.token as string
          ] = manifestItem;
        });
      },
      list() {
        return Object.values(tokenToManifestItem);
      },
    },
  };
}
