# @daisugi/kintsugi

[![version](https://img.shields.io/npm/v/@daisugi/kintsugi.svg)](https://www.npmjs.com/package/@daisugi/kintsugi)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/kintsugi)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/kintsugi)](https://bundlephobia.com/result?p=@daisugi/kintsugi)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

[Zero dependencies and small size.](https://bundlephobia.com/result?p=@daisugi/kintsugi) | Used in production.

Kintsugi is a set of utilities to help build fault tolerant services.

---

## ✨ Features

- 💡 Minimal size overhead ([details](https://bundlephobia.com/result?p=@daisugi/kintsugi))
- ⚡️ Written in TypeScript
- 📦 Uses only trusted dependencies
- 🔨 Powerful and agnostic to your code
- 🧪 Well-tested
- 🤝 Used in production
- 🔀 Supports both ES Modules and CommonJS

---

## 🚀 Usage

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

---

## 📖 Table of Contents

- [@daisugi/kintsugi](#daisugikintsugi)
  - [✨ Features](#-features)
  - [🚀 Usage](#-usage)
  - [📖 Table of Contents](#-table-of-contents)
  - [📦 Installation](#-installation)
  - [🔍 API](#-api)
  - [⚡ withCache](#-withcache)
    - [Usage](#usage)
    - [API](#api)
    - [Examples](#examples)
  - [🔄 withRetry](#-withretry)
    - [Usage](#usage-1)
    - [API](#api-1)
  - [🕒 withTimeout](#-withtimeout)
    - [Usage](#usage-2)
    - [API](#api-2)
  - [🔒 withCircuitBreaker](#-withcircuitbreaker)
    - [Usage](#usage-3)
    - [API](#api-3)
  - [🔄 reusePromise](#-reusepromise)
    - [Usage](#usage-4)
    - [API](#api-4)
  - [🕒 waitFor](#-waitfor)
    - [Usage](#usage-5)
    - [API](#api-5)
  - [🗄️ SimpleMemoryStore](#️-simplememorystore)
    - [Usage](#usage-6)
  - [📄 Code](#-code)
    - [Usage](#usage-7)
  - [❗ CustomError](#-customerror)
    - [Usage](#usage-8)
    - [API](#api-6)
  - [⏳ deferredPromise](#-deferredpromise)
    - [Usage](#usage-9)
    - [API](#api-7)
  - [🎲 randomBetween](#-randombetween)
    - [Usage](#usage-10)
    - [API](#api-8)
  - [🔢 encToFNV1A](#-enctofnv1a)
    - [Usage](#usage-11)
    - [API](#api-9)
  - [📜 Etymology](#-etymology)
  - [🌍 Other Projects](#-other-projects)
  - [📜 License](#-license)

---

## 📦 Installation

Using npm:

```sh
npm install @daisugi/kintsugi
```

Using pnpm:

```sh
pnpm install @daisugi/kintsugi
```

[:top: Back to top](#-table-of-contents)

---

## 🔍 API

> Note: The helpers in this library expect that your functions return a Result instance.

---

## ⚡ withCache

Cache serializable function call results.

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

**Options:**

- **cacheStore**: Instance implementing `CacheStore` interface (default: `SimpleMemoryStore`).
- **version**: Version string for cache key invalidation (default: `v1`).
- **maxAgeMs**: TTL in milliseconds (default: `14400000` which is 4 hours).
- **buildCacheKey**: Function to generate cache key from function hash, version, and arguments.

  _Default:_
  ```js
  function buildCacheKey(fnHash, version, args) {
    return `${fnHash}:${version}:${stringify(args)}`;
  }
  ```

- **calculateCacheMaxAgeMs**: Function to calculate TTL with jitter.

  _Default:_
  ```js
  function calculateCacheMaxAgeMs(maxAgeMs) {
    return randomBetween(maxAgeMs * 0.75, maxAgeMs);
  }
  ```

- **shouldCache**: Function to determine if the response should be cached.

  _Default:_
  ```js
  function shouldCache(response) {
    if (response.isSuccess) return true;
    if (response.isFailure && response.error.code === Code.NotFound) return true;
    return false;
  }
  ```

- **shouldInvalidateCache**: Function to decide if the cache should be invalidated.

  _Default:_
  ```js
  function shouldInvalidateCache(args) {
    return false;
  }
  ```

The helpers `buildCacheKey`, `calculateCacheMaxAgeMs`, `shouldCache`, and `shouldInvalidateCache` are also exported for customization.

### Examples

For example usage with custom stores, see [RedisCacheStore](./examples/redis_cache_store.ts).

[:top: Back to top](#-table-of-contents)

---

## 🔄 withRetry

Retry function calls with exponential backoff and custom strategies to handle failures.

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

**Options:**

- **firstDelayMs**: Initial retry delay (default: `200` ms).
- **maxDelayMs**: Maximum delay (default: `600` ms).
- **timeFactor**: Factor for exponential backoff (default: `2`).
- **maxRetries**: Maximum retry attempts (default: `3`).
- **calculateRetryDelayMs**: Function to compute delay using exponential backoff with full jitter.

  _Default:_
  ```js
  function calculateRetryDelayMs(firstDelayMs, maxDelayMs, timeFactor, retryNumber) {
    const delayMs = Math.min(maxDelayMs, firstDelayMs * timeFactor ** retryNumber);
    return randomBetween(0, delayMs);
  }
  ```

- **shouldRetry**: Function to decide if a retry should occur.

  _Default:_
  ```js
  function shouldRetry(response, retryNumber, maxRetries) {
    if (response.isFailure) {
      if (response.error.code === Code.CircuitSuspended) return false;
      if (retryNumber < maxRetries) return true;
    }
    return false;
  }
  ```

The helpers `calculateRetryDelayMs` and `shouldRetry` are also exported for customization.

[:top: Back to top](#-table-of-contents)

---

## 🕒 withTimeout

Wait for a function’s response and return a timeout result if it exceeds a maximum time.

### Usage

```js
import { withTimeout, waitFor } from '@daisugi/kintsugi';
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

**Options:**

- **maxTimeMs**: Maximum wait time in ms (default: `600`).

[:top: Back to top](#-table-of-contents)

---

## 🔒 withCircuitBreaker

Implements the circuit-breaker pattern using a sliding window to prevent cascading failures.

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

**Options:**

- **windowDurationMs**: Duration of the rolling window (default: `30000` ms).
- **totalBuckets**: Number of buckets in the rolling window (default: `10`).
- **failureThresholdRate**: Failure rate percentage to trip the circuit (default: `50`).
- **volumeThreshold**: Minimum number of requests needed to trigger the circuit (default: `10`).
- **returnToServiceAfterMs**: Time in ms before moving from open to half-open (default: `5000`).
- **isFailureResponse**: Function to detect failed responses.

  _Default:_
  ```js
  function isFailureResponse(response) {
    if (response.isSuccess) return false;
    if (response.isFailure && response.error.code === Code.NotFound) return false;
    return true;
  }
  ```

The helper `isFailureResponse` is also exported for customization.

[:top: Back to top](#-table-of-contents)

---

## 🔄 reusePromise

Prevents an asynchronous function from running concurrently by caching the promise until resolution.

### Usage

```js
import { reusePromise, waitFor } from '@daisugi/kintsugi';
import { Result } from '@daisugi/anzen';

async function fnToBeReused() {
  await waitFor(1000);
  return Result.success('Hi Benadryl Cumberbatch.');
}

const fn = reusePromise(fnToBeReused);

fn(); // Runs the function and waits for the response.
fn(); // Reuses the ongoing promise.
```

### API

```js
reusePromise(fn: Function) => Function;
```

[:top: Back to top](#-table-of-contents)

---

## 🕒 waitFor

A utility to create a promise-based timeout.

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

[:top: Back to top](#-table-of-contents)

---

## 🗄️ SimpleMemoryStore

A basic cache store implementing `CacheStore` with simple `get`/`set` methods. It wraps responses in a Result.

### Usage

```js
import { SimpleMemoryStore } from '@daisugi/kintsugi';

const simpleMemoryStore = new SimpleMemoryStore();

simpleMemoryStore.set('key', 'Benadryl Cumberbatch.');

const response = simpleMemoryStore.get('key');

if (response.isSuccess) {
  console.log(response.getValue());
  // 'Benadryl Cumberbatch.'
}
```

[:top: Back to top](#-table-of-contents)

---

## 📄 Code

An enumeration of HTTP and custom status codes.
See more: [Code.ts](./src/Code.ts)

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

[:top: Back to top](#-table-of-contents)

---

## ❗ CustomError

Creates an Error object with an additional `code` property.

### Usage

```js
import { CustomError } from '@daisugi/kintsugi';

const customError = new CustomError('response', Code.NotFound);

throw customError;

// customError.toString() returns 'NotFound: response'.
// customError.code === Code.NotFound
```

### API

```js
CustomError(message: string, code: string) => Error;
```

[:top: Back to top](#-table-of-contents)

---

## ⏳ deferredPromise

Implements the deferred pattern on top of a promise. Returns an object with `resolve` and `reject` methods.

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

[:top: Back to top](#-table-of-contents)

---

## 🎲 randomBetween

Returns a random integer between two numbers.

### Usage

```js
import { randomBetween } from '@daisugi/kintsugi';

const randomNumber = randomBetween(100, 200);
// Random number between 100 and 200.
```

### API

```js
randomBetween(min: Number, max: Number) => Number;
```

[:top: Back to top](#-table-of-contents)

---

## 🔢 encToFNV1A

A non-cryptographic hash function.

### Usage

```js
import { encToFNV1A } from '@daisugi/kintsugi';

const hash = encToFNV1A(JSON.stringify({ name: 'Hi Benadryl Cumberbatch.' }));
```

### API

```js
encToFNV1A(input: String | Buffer) => String;
```

[:top: Back to top](#-table-of-contents)

---

## 📜 Etymology

Kintsugi is the Japanese art of repairing broken objects by mending the cracks with gold, highlighting rather than hiding the damage.

More info: [Esprit Kintsugi](https://esprit-kintsugi.com/en/quest-ce-que-le-kintsugi/)

[:top: Back to top](#-table-of-contents)

---

## 🌍 Other Projects

[Meet the ecosystem](../../README.md)

[:top: Back to top](#-table-of-contents)

---

## 📜 License

[MIT](../../LICENSE)

[:top: Back to top](#-table-of-contents)
