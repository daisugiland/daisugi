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

### Result

Helper used for returning and propagating errors. More [info](https://khalilstemmler.com/articles/enterprise-typescript-nodejs/handling-errors-result-class/).

#### Usage

```javascript
const { result, Code } = '@daisugi/kintsugi';

function fn(random) {
  if (random < 0.5) {
    return result.ok('Hi Benadryl Cumberbatch.');
  }

  return result.fail({
    code: Code.UnexpectedError,
  });
}

const response = fn(Math.random());

if (response.isSuccess) {
  console.log(response.value);
}
```

#### API

```javascript
result.ok('Hi Benadryl Cumberbatch.');
// =>
// {
//   isSuccess: true,
//   isFailure: false,
//   value: 'Hi Benadryl Cumberbatch.',
//   error: null,
// }
```

```javascript
result.fail('Bye Benadryl Cumberbatch.');
// =>
// {
//   isSuccess: false,
//   isFailure: true,
//   value: null,
//   error: 'Bye Benadryl Cumberbatch.',
// }
```

Result returns plain object to be easily serialized if needed.

> Notice the helpers provided by this library are expecting that your functions are returning result instance as responses.

### Cache

#### Usage

```javascript
const { createWithCache, result, SimpleMemoryStore } =
  '@daisugi/kintsugi';

const simpleMemoryStore = new SimpleMemoryStore();
const withCache = createWithCache(simpleMemoryStore);

function fnToBeCached() {
  return result.ok('Hi Benadryl Cumberbatch.');
}

const fnWithCache = withCache(fnToBeCached);

fnWithCache();
```

#### API

```javascript
createWithCache(cacheStore: Object, options: Object = {}) => withCache;
```

Used to create `withCache` helper.

- `cacheStore` An instance of the cache store, following `CacheStore` interface.
- `options` Is an object that can contain any of the following properties:

  - `version` Version string used to build the cache key. Useful to manually invalidate cache key (default: `v1`).
  - `maxAgeMs` also known as TTL (default: `14400000`) 4h.
  - `buildCacheKey` The function used to generate cache key, it receives a hash of the source code of the function itself (`fnHash`), needed to automatically invalidate cache when function code is changed, also receives `version`, and the last parameter are arguments provided to the original function (`args`). Default:

    ```javascript
    function buildCacheKey(fnHash, version, args) {
      return `${fnHash}:${version}:${JSON.stringify(args)}`;
    }
    ```

  - `calculateCacheMaxAgeMs` Used to calculate max age in ms, uses jitter, based on provided `maxAgeMs` property, default:

    ```javascript
    function calculateCacheMaxAgeMs(maxAgeMs) {
      return randomBetween(maxAgeMs * 0.75, maxAgeMs);
    }
    ```

  - `shouldCache` Determines when and when not cache the returned value. By default caches `NotFound` code. default:

    ```javascript
    function shouldCache(response) {
      if (response.isSuccess) {
        return true;
      }

      if (
        response.isFailure &&
        response.error.code === Code.NotFound
      ) {
        return true;
      }

      return false;
    }
    ```

  - `shouldInvalidateCache` Useful to determine when you need to invalidate the cache key. For example provide refresh parameter to the function. default:

    ```javascript
    function shouldInvalidateCache(args) {
      return false;
    }
    ```

  `buildCacheKey`, `calculateCacheMaxAgeMs`, `shouldCache` and `shouldInvalidateCache` are also exported to be used in the new implementations.

```javascript
withCache(fn: Function, options: Object = {}) => Function;
```

Used to decorate with cache any function.

- `fn` Function to be cached.
- `options` Overrides `createWithCache` options.

## FAQ

### Where does the name come from?

Kintsugi is the Japanese art of repairing a broken object by enhancing its scars with real gold powder, instead of trying to hide them.

More info: https://esprit-kintsugi.com/en/quest-ce-que-le-kintsugi/
