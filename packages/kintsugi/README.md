# @daisugi/kintsugi

Kintsugi is a set of utilities to help build a fault tolerant services.

- [@daisugi/kintsugi](#-daisugi-kintsugi)
  - [Install](#install)
  - [result](#result)
    - [Usage](#usage)
    - [API](#api)
  - [withCache](#withcache)
    - [Usage](#usage-1)
    - [API](#api-1)
  - [withRetry](#withretry)
    - [Usage](#usage-2)
    - [API](#api-2)
  - [withTimeout](#withtimeout)
    - [Usage](#usage-3)
    - [API](#api-3)
  - [reusePromise](#reusepromise)
    - [Usage](#usage-4)
    - [API](#api-4)
  - [waitFor](#waitfor)
    - [Usage](#usage-5)
    - [API](#api-5)
  - [SimpleMemoryStore](#simplememorystore)
    - [Usage](#usage-6)
  - [FAQ](#faq)
    - [Where does the name come from?](#where-does-the-name-come-from)
  - [License](#license)

## Install

Using npm:

```sh
npm install @daisugi/kintsugi
```

Using yarn:

```sh
yarn add @daisugi/kintsugi
```

## result

Helper used for returning and propagating errors. More [info](https://khalilstemmler.com/articles/enterprise-typescript-nodejs/handling-errors-result-class/).

### Usage

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

### API

```javascript
result.ok('Hi Benadryl Cumberbatch.');
// ->
// {
//   isSuccess: true,
//   isFailure: false,
//   value: 'Hi Benadryl Cumberbatch.',
//   error: null,
// }
```

```javascript
result.fail('Bye Benadryl Cumberbatch.');
// ->
// {
//   isSuccess: false,
//   isFailure: true,
//   value: null,
//   error: 'Bye Benadryl Cumberbatch.',
// }
```

Result returns plain object to be easily serialized if needed.

> Notice the helpers provided by this library are expecting that your functions are returning result instance as responses.

## withCache

Cache serializable function calls results.

### Usage

```javascript
const { withCache, result } = '@daisugi/kintsugi';

function fnToBeCached() {
  return result.ok('Hi Benadryl Cumberbatch.');
}

const fnWithCache = withCache(fnToBeCached);

fnWithCache();
```

### API

```javascript
withCache(fn: Function, options: Object = {}) => Function;
```

- `fn` Function to be cached.
- `options` Is an object that can contain any of the following properties:

  - `cacheStore` An instance of the cache store, implementing `CacheStore` interface (default: `SimpleMemoryStore`).
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

  `buildCacheKey`, `calculateCacheMaxAgeMs`, `shouldCache` and `shouldInvalidateCache` are also exported, useful for the customizations.

## withRetry

Retry function calls with an exponential backoff and custom retry strategies for failed operations.

### Usage

```javascript
const { withRetry, result } = '@daisugi/kintsugi';

function fn() {
  return result.ok('Hi Benadryl Cumberbatch.');
}

const fnWithRetry = withRetry(fn);

fnWithRetry();
```

### API

```javascript
withRetry(fn: Function, options: Object = {}) => Function;
```

- `fn` Function to wrap with retry strategy.
- `options` Is an object that can contain any of the following properties:

  - `firstDelayMs` Used to calculate retry delay (default: `200`).
  - `maxDelayMs` Time limit for the retry delay (default: `600`).
  - `timeFactor` Used to calculate exponential backoff retry delay (default: `2`).
  - `maxRetries` Limit of retry attempts (default: `3`).
  - `calculateRetryDelayMs` Function used to calculate delay between retry calls. By default calculates exponential backoff with full jitter. Default:

    ```javascript
    function calculateRetryDelayMs(
      firstDelayMs,
      maxDelayMs,
      timeFactor,
      retryNumber,
    ) {
      const delayMs = Math.min(
        maxDelayMs,
        firstDelayMs * timeFactor ** retryNumber,
      );

      const delayWithJitterMs = randomBetween(0, delayMs);

      return delayWithJitterMs;
    }
    ```

  - `shouldRetry` Determines when retry is needed. By default takes in account the max number of attempts, and if was block by circuit breaker. Default:

    ```javascript
    function shouldRetry(
      response,
      retryNumber,
      maxRetries,
    ) {
      if (response.isFailure) {
        if (response.error.code === Code.CircuitSuspended) {
          return false;
        }

        if (retryNumber < maxRetries) {
          return true;
        }
      }

      return false;
    }
    ```

  `calculateRetryDelayMs` and `shouldRetry` are also exported, useful for the customizations.

## withTimeout

Wait for the response of the function, if it exceeds the maximum time, it returns a result with timeout.

### Usage

```javascript
const { withTimeout, waitFor, result } =
  '@daisugi/kintsugi';

async function fn() {
  await waitFor(8000);

  return result.ok('Hi Benadryl Cumberbatch.');
}

const fnWithTimeout = withTimeout(fn);

fnWithTimeout();
```

### API

```javascript
withTimeout(fn: Function, options: Object = {}) => Function;
```

- `fn` Function to be wrapped with timeout.
- `options` Is an object that can contain any of the following properties:

  - `maxTimeMs` Max time to wait the function response, in ms. (default: `600`).

## reusePromise

Prevent an async function to run more than once concurrently by temporarily caching the promise until it's resolved/rejected.

### Usage

```javascript
const { reusePromise, waitFor, result } =
  '@daisugi/kintsugi';

async function fnToBeReused() {
  await waitFor(1000);

  return result.ok('Hi Benadryl Cumberbatch.');
}

const fn = reusePromise(fnToBeReused);

fn(); // It runs the promise and waits the response.
fn(); // Waits the response of the running promise.
```

### API

```javascript
reusePromise(asyncFn: Function) => Function;
```

## waitFor

Useful promisified timeout.

### Usage

```javascript
const { waitFor } = '@daisugi/kintsugi';

async function fn() {
  await waitFor(1000);

  return result.ok('Hi Benadryl Cumberbatch.');
}

fn();
```

### API

```javascript
waitFor(delayMs: Number) => Promise;
```

## SimpleMemoryStore

A simple `CacheStore` implementation, with `get/set` methods. It wraps the response into `result`.

### Usage

```javascript
const { SimpleMemoryStore } = '@daisugi/kintsugi';

const simpleMemoryStore = new SimpleMemoryStore();

simpleMemoryStore.set('key', 'Benadryl Cumberbatch.');

const response = simpleMemoryStore.get('key');

if (response.isSuccess) {
  return response.value;
  // -> 'Benadryl Cumberbatch.'
}
```

## FAQ

### Where does the name come from?

Kintsugi is the Japanese art of repairing a broken object by enhancing its scars with real gold powder, instead of trying to hide them.

More info: https://esprit-kintsugi.com/en/quest-ce-que-le-kintsugi/

## License

[MIT](../../LICENSE)
