# @daisugi/kintsugi

Kintsugi is a set of utilities to help build a fault tolerant services.

## Install

Using npm:

```sh
npm install @daisugi/kintsugi
```

Using yarn:

```sh
yarn add @daisugi/kintsugi
```

## API

### withCache

```javascript
const { createWithCache, result, SimpleMemoryStore } =
  '@daisugi/kintsugi';

const simpleMemoryStore = new SimpleMemoryStore();
const withCache = createWithCache(simpleMemoryStore);

function foo() {
  return result.ok('Hi Benadryl Cumberbatch.');
}

const fooWithCache = withCache(foo);

fooWithCache();
```

## FAQ

### Where does the name come from?

Kintsugi is the Japanese art of repairing a broken object by enhancing its scars with real gold powder, instead of trying to hide them.

More info: https://esprit-kintsugi.com/en/quest-ce-que-le-kintsugi/
