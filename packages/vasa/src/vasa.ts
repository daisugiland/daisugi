export interface VasaManifestItem {
  token: string;
  useClass?: any;
  useValue?: any;
  useFactory?: any;
  useFactoryWithParams?: any;
  params?: string[];
  instance?: any;
  scope?: 'Transient' | 'Singleton';
}

export type VasaToken = string | symbol;

type TokenToManifestItem = Record<
  VasaToken,
  VasaManifestItem
>;

export function vasa() {
  const tokenToManifest: TokenToManifestItem =
    Object.create(null);

  return {
    container: {
      resolve(token: VasaToken) {
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
      register(manifest: VasaManifestItem[]) {
        manifest.forEach((manifestItem) => {
          tokenToManifest[manifestItem.token] =
            manifestItem;
        });
      },
      list() {
        return Object.values(tokenToManifest);
      },
    },
  };
}
