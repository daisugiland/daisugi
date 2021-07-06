interface VasaManifest {
  token: string;
  useClass: any;
  params?: string[];
}

export function vasa() {
  const store = Object.create(null);

  return {
    container: {
      resolve() {},
      register(manifests: VasaManifest[]) {
        manifests.forEach((manifest) => {
          store[manifest.token] = 'a';
        });
      },
    },
  };
}
