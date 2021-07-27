export type KadoToken = string | symbol;

export interface KadoManifestItem {
  token: KadoToken;
  useClass?: any;
  useValue?: any;
  useFactory?: any;
  useFactoryWithParams?: any;
  params?: KadoToken[];
  instance?: any;
  scope?: 'Transient' | 'Singleton';
}

type TokenToManifestItem = Record<
  KadoToken,
  KadoManifestItem
>;

export function kado() {
  const tokenToManifest: TokenToManifestItem =
    Object.create(null);

  return {
    container: {
      resolve(token: KadoToken) {
        const manifestItem =
          tokenToManifest[token as string];

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
      register(manifest: KadoManifestItem[]) {
        manifest.forEach((manifestItem) => {
          tokenToManifest[manifestItem.token as string] =
            manifestItem;
        });
      },
      list() {
        return Object.values(tokenToManifest);
      },
    },
  };
}
