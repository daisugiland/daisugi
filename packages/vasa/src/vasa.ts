interface VasaManifestItem {
  token: string;
  useClass?: any;
  useValue?: any;
  useFactory?: any;
  params?: string[];
  scope?: 'Transient' | 'Singleton';
}

interface PrivateManifestItem {
  token: string;
  useClass?: any;
  useValue?: any;
  useFactory?: any;
  params?: string[];
  instance?: any;
  scope?: 'Transient' | 'Singleton';
}

export function vasa() {
  const tokenToManifest: Record<
    string,
    PrivateManifestItem
  > = Object.create(null);

  return {
    container: {
      resolve(token) {
        const manifestItem = tokenToManifest[token];

        if (manifestItem.useValue) {
          return manifestItem.useValue;
        }

        if (manifestItem.instance) {
          return manifestItem.instance;
        }

        if (manifestItem.useFactory) {
          return manifestItem.useFactory(this);
        }

        let paramsInstance = null;

        if (manifestItem.params) {
          paramsInstance = manifestItem.params.map(
            (param) => this.resolve(param),
          );
        }

        if (manifestItem.scope === 'Transient') {
          return paramsInstance
            ? new manifestItem.useClass(...paramsInstance)
            : new manifestItem.useClass();
        }

        manifestItem.instance = paramsInstance
          ? new manifestItem.useClass(...paramsInstance)
          : new manifestItem.useClass();

        return manifestItem.instance;
      },
      register(manifest: VasaManifestItem[]) {
        manifest.forEach((manifestItem) => {
          tokenToManifest[manifestItem.token] =
            manifestItem;
        });
      },
    },
  };
}
