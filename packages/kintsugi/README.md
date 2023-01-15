# @daisugi/kintsugi

[![version](https://img.shields.io/npm/v/@daisugi/kintsugi.svg)](https://www.npmjs.com/package/@daisugi/kintsugi)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/kintsugi)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/kintsugi)](https://bundlephobia.com/result?p=@daisugi/kintsugi)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

[Zero dependencies and small size.](https://bundlephobia.com/result?p=@daisugi/kintsugi) | Used in production.

Kintsugi is a set of utilities to help build a fault tolerant services.

## Usage

```js
import {
  reusePromise,
  waitFor,
  withCache,
  withCircuitBreaker,
  withRetry,
} from '@daisugi/kintsugi';
import { Result } from '@daisugi/anzen';

async function fn() {
  await waitFor(1000);

  return Result.success('Hi Benadryl Cumberbatch.');
}

const rockSolidFn = withCache(
  withRetry(withCircuitBreaker(reusePromise(fn))),
);
```

## Table of contents

- [@daisugi/kintsugi](#daisugikintsugi)
  - [Usage](#usage)
  - [Table of contents](#table-of-contents)
  - [Install](#install)
    - [API](#api)
  - [withCache](#withcache)
    - [Usage](#usage-1)
    - [API](#api-1)
    - [Examples](#examples)
  - [withRetry](#withretry)
    - [Usage](#usage-2)
    - [API](#api-2)
  - [withTimeout](#withtimeout)
    - [Usage](#usage-3)
    - [API](#api-3)
  - [withCircuitBreaker](#withcircuitbreaker)
    - [Usage](#usage-4)
    - [API](#api-4)
  - [reusePromise](#reusepromise)
    - [Usage](#usage-5)
    - [API](#api-5)
  - [waitFor](#waitfor)
    - [Usage](#usage-6)
    - [API](#api-6)
  - [SimpleMemoryStore](#simplememorystore)
    - [Usage](#usage-7)
  - [Code](#code)
    - [Usage](#usage-8)
  - [CustomError](#customerror)
    - [Usage](#usage-9)
    - [API](#api-7)
  - [deferredPromise](#deferredpromise)
    - [Usage](#usage-10)
    - [API](#api-8)
  - [randomBetween](#randombetween)
    - [Usage](#usage-11)
    - [API](#api-9)
  - [encToFNV1A](#enctofnv1a)
    - [Usage](#usage-12)
    - [API](#api-10)
  - [Etymology](#etymology)
  - [Other projects](#other-projects)
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

[:top: back to top](#table-of-contents)

### API

> Notice the helpers provided by this library are expecting that your functions are returning result instance as responses.

## withCache

Cache serializable function calls results.

### Usage

```js
import { withCache } from '@daisugi/kintsugi';
import { Result } from '@daisugi/anzen';

function fnToBeCached() {
  return Result.success('Hi Benadryl Cumberbatch.');
}

const fnWithCache = withCache(fnToBeCached);

fnWithCache();
```

### API

```js
withCache(fn: Function, opts: Object = {}) => Function;
```

- `fn` Function to be cached.
- `opts` Is an object that can contain any of the following properties:

  - `cacheStore` An instance of the cache store, implementing `CacheStore` interface (default: `SimpleMemoryStore`).
  - `version` Version string used to build the cache key. Useful to manually invalidate cache key (default: `v1`).
  - `maxAgeMs` also known as TTL (default: `14400000`) 4h.
  - `buildCacheKey` The function used to generate cache key, it receives a hash of the source code of the function itself (`fnHash`), needed to automatically invalidate cache when function code is changed, also receives `version`, and the last parameter are arguments provided to the original function (`args`). Default:

    ```js
    function buildCacheKey(fnHash, version, args) {
      return `${fnHash}:${version}:${stringify(args)}`;
    }
    ```

  - `calculateCacheMaxAgeMs` Used to calculate max age in ms, uses jitter, based on provided `maxAgeMs` property, default:

    ```js
    function calculateCacheMaxAgeMs(maxAgeMs) {
      return randomBetween(maxAgeMs * 0.75, maxAgeMs);
    }
    ```

  - `shouldCache` Determines when and when not cache the returned value. By default caches `NotFound` code. default:

    ```js
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

    ```js
    function shouldInvalidateCache(args) {
      return false;
    }
    ```

  `buildCacheKey`, `calculateCacheMaxAgeMs`, `shouldCache` and `shouldInvalidateCache` are also exported, useful for the customizations.

### Examples

Some examples to see how to use `withCache` with custom stores in your applications.

- [RedisCacheStore](./examples/redis_cache_store.ts) uses [ioredis](https://github.com/luin/ioredis).

[:top: back to top](#table-of-contents)

## withRetry

Retry function calls with an exponential backoff and custom retry strategies for failed operations. Retry is useful to avoid intermittent network hiccups. Retry may produce a burst number of requests upon dependent services is why it need to be used in combination with other patterns.

### Usage

```js
import { withRetry } from '@daisugi/kintsugi';
import { Result } from '@daisugi/anzen';

function fn() {
  return Result.success('Hi Benadryl Cumberbatch.');
}

const fnWithRetry = withRetry(fn);

fnWithRetry();
```

### API

```js
withRetry(fn: Function, opts: Object = {}) => Function;
```

- `fn` Function to wrap with retry strategy.
- `opts` Is an object that can contain any of the following properties:

  - `firstDelayMs` Used to calculate retry delay (default: `200`).
  - `maxDelayMs` Time limit for the retry delay (default: `600`).
  - `timeFactor` Used to calculate exponential backoff retry delay (default: `2`).
  - `maxRetries` Limit of retry attempts (default: `3`).
  - `calculateRetryDelayMs` Function used to calculate delay between retry calls. By default calculates exponential backoff with full jitter. Default:

    ```js
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

    ```js
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

[:top: back to top](#table-of-contents)

## withTimeout

Wait for the response of the function, if it exceeds the maximum time, it returns a `result` with timeout. Useful to time limit in not mandatory content.

### Usage

```js
import {
  withTimeout,
  waitFor,
} from '@daisugi/kintsugi';
import { Result } from '@daisugi/anzen';

async function fn() {
  await waitFor(8000);

  return Result.success('Hi Benadryl Cumberbatch.');
}

const fnWithTimeout = withTimeout(fn);

fnWithTimeout();
```

### API

```js
withTimeout(fn: Function, opts: Object = {}) => Function;
```

- `fn` Function to be wrapped with timeout.
- `opts` Is an object that can contain any of the following properties:

  - `maxTimeMs` Max time to wait the function response, in ms. (default: `600`).

[:top: back to top](#table-of-contents)

## withCircuitBreaker

An implementation of the Circuit-breaker pattern using sliding window. Useful to prevent cascading failures in distributed systems.

### Usage

```js
import { withCircuitBreaker } from '@daisugi/kintsugi';
import { Result } from '@daisugi/anzen';

function fn() {
  return Result.success('Hi Benadryl Cumberbatch.');
}

const fnWithCircuitBreaker = withCircuitBreaker(fn);

fnWithCircuitBreaker();
```

### API

```js
withCircuitBreaker(fn: Function, opts: Object = {}) => Function;
```

- `fn` Function to wrap with circuit-breaker strategy.
- `opts` Is an object that can contain any of the following properties:

  - `windowDurationMs` Duration of rolling window in milliseconds. (default: `30000`).
  - `totalBuckets` Number of buckets to retain in a rolling window (default: `10`).
  - `failureThresholdRate` Percentage of the failures at which the circuit should trip open and start short-circuiting requests (default: `50`).
  - `volumeThreshold` Minimum number of requests in rolling window needed before tripping the circuit will occur. (default: `10`).
  - `returnToServiceAfterMs` Is the period of the open state, after which the state becomes half-open. (default: `5000`).
  - `isFailureResponse` Function used to detect failed requests. Default:

    ```js
    function isFailureResponse(response) {
      if (response.isSuccess) {
        return false;
      }

      if (
        response.isFailure &&
        response.error.code === Code.NotFound
      ) {
        return false;
      }

      return true;
    }
    ```

  `isFailureResponse` is also exported, useful for the customizations.

[:top: back to top](#table-of-contents)

## reusePromise

Prevent an async function to run more than once concurrently by temporarily caching the promise until it's resolved/rejected.

### Usage

```js
import {
  reusePromise,
  waitFor,
} from '@daisugi/kintsugi';
import { Result } from '@daisugi/anzen';

async function fnToBeReused() {
  await waitFor(1000);

  return Result.success('Hi Benadryl Cumberbatch.');
}

const fn = reusePromise(fnToBeReused);

fn(); // It runs the promise and waits the response.
fn(); // Waits the response of the running promise.
```

### API

```js
reusePromise(fn: Function) => Function;
```

[:top: back to top](#table-of-contents)

## waitFor

Useful promisified timeout.

### Usage

```js
import { waitFor } from '@daisugi/kintsugi';

async function fn() {
  await waitFor(1000);

  return Result.success('Hi Benadryl Cumberbatch.');
}

fn();
```

### API

```js
waitFor(delayMs: Number) => Promise;
```

[:top: back to top](#table-of-contents)

## SimpleMemoryStore

A simple `CacheStore` implementation, with `get/set` methods. It wraps the response into `result`.

### Usage

```js
import { SimpleMemoryStore } from '@daisugi/kintsugi';

const simpleMemoryStore = new SimpleMemoryStore();

simpleMemoryStore.set('key', 'Benadryl Cumberbatch.');

const response = simpleMemoryStore.get('key');

if (response.isSuccess) {
  return response.getValue();
  // -> 'Benadryl Cumberbatch.'
}
```

[:top: back to top](#table-of-contents)

## Code

An enum of HTTP based, and custom status codes, [more](./src/Code.ts).

### Usage

```js
import { Code, result } from '@daisugi/kintsugi';
import { Result } from '@daisugi/anzen';

function response() {
  return Result.failure({
    message: 'response',
    code: Code.NotFound,
  });
}
```

[:top: back to top](#table-of-contents)

## CustomError

Returns inherited Error object with the code property, among the rest of the Error properties.

### Usage

```js
import { CustomError } from '@daisugi/kintsugi';

const customError = new CustomError(
  'response',
  Code.NotFound,
);

throw customError;

// customError.toString() would return 'NotFound: response'.
// customError.code === Code.NotFound
```

### API

```js
CustomError(message: string, code: string) => Error;
```

[:top: back to top](#table-of-contents)

## deferredPromise

The deferred pattern implementation on top of promise. Returns a deferred object with `resolve` and `reject` methods.

### Usage

```js
import { deferredPromise } from '@daisugi/kintsugi';

async function fn() {
  const whenIsStarted = deferredPromise();

  setTimeout(() => {
    whenIsStarted.resolve();
  }, 1000);

  return whenIsStarted.promise;
}

fn();
```

### API

```js
deferredPromise() => {
  resolve: (value: unknown) => void,
  reject: (reason?: any) => void,
  promise: Promise,
  isFulfilled: () => Boolean,
  isPending: () => Boolean,
  isRejected: () => Boolean,
};
```

[:top: back to top](#table-of-contents)

## randomBetween

A function returns a random integer between given numbers.

### Usage

```js
import { randomBetween } from '@daisugi/kintsugi';

const randomNumber = randomBetween(100, 200);
// -> Random number between 100 and 200.
```

### API

```js
randomBetween(min: Number, max: Number) => Number;
```

[:top: back to top](#table-of-contents)

## encToFNV1A

A non-cryptographic hash function.

### Usage

```js
import { encToFNV1A } from '@daisugi/kintsugi';

const hash = encToFNV1A(
  JSON.stringify({ name: 'Hi Benadryl Cumberbatch.' }),
);
```

### API

```js
encToFNV1A(input: String | Buffer) => String;
```

[:top: back to top](#table-of-contents)

## Etymology

Kintsugi is the Japanese art of repairing a broken object by enhancing its scars with real gold powder, instead of trying to hide them.

More info: https://esprit-kintsugi.com/en/quest-ce-que-le-kintsugi/

[:top: back to top](#table-of-contents)

## Other projects

[Meet the ecosystem](../../README.md)

[:top: back to top](#table-of-contents)

## License

[MIT](../../LICENSE)
