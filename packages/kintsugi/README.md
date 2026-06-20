# @daisugi/kintsugi

[![version](https://img.shields.io/npm/v/@daisugi/kintsugi.svg)](https://www.npmjs.com/package/@daisugi/kintsugi)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/kintsugi)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/kintsugi)](https://bundlephobia.com/result?p=@daisugi/kintsugi)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Kintsugi** - a set of utilities for building fault-tolerant services.

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
  withRetry,
} from '@daisugi/kintsugi';
import { Result } from '@daisugi/anzen';

async function fn() {
  await waitFor(1000);
  return Result.success('Hi Benadryl Cumberbatch.');
}

const rockSolidFn = withCache(
  withRetry(reusePromise(fn)),
);
```

---

## 📖 Table of Contents

- [@daisugi/kintsugi](#daisugikintsugi)
  - [✨ Features](#-features)
  - [🚀 Usage](#-usage)
  - [📖 Table of Contents](#-table-of-contents)
  - [📦 Installation](#-installation)
  - [🔍 Overview](#-overview)
  - [📚 API](#-api)
    - [`withCache(fn, opts?)`](#withcachefn-opts)
    - [`withRetry(fn, opts?)`](#withretryfn-opts)
    - [`withTimeout(fn, opts?)`](#withtimeoutfn-opts)
    - [`withPool(fn, opts?)` / `createWithPool(opts?)`](#withpoolfn-opts--createwithpoolopts)
    - [`reusePromise(fn)`](#reusepromisefn)
    - [`waitFor(delayMs)`](#waitfordelayms)
    - [`SimpleMemoryStore`](#simplememorystore)
    - [`deferredPromise()`](#deferredpromise)
    - [`randomIntBetween(min, max)`](#randomintbetweenmin-max)
    - [`hashFNV1A(input)`](#hashfnv1ainput)
  - [🌸 Etymology](#-etymology)
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

## 🔍 Overview

**Kintsugi** wraps your functions with battle-tested resilience patterns, so a single slow or failing dependency does not cascade through your service. It provides:

- ✅ Result-based caching with TTL, jitter, and pluggable stores (`withCache`)
- ✅ Retries with exponential backoff and full jitter (`withRetry`)
- ✅ Per-call timeouts (`withTimeout`)
- ✅ Concurrency limiting via per-function or shared pools (`withPool`)
- ✅ In-flight promise de-duplication (`reusePromise`)
- ✅ Promise helpers (`waitFor`, `deferredPromise`)
- ✅ A bounded (LRU) in-memory `CacheStore` implementation (`SimpleMemoryStore`)
- ✅ Small utilities (`randomIntBetween`, `hashFNV1A`)
- ✅ Built on [@daisugi/anzen](../anzen) Results and [@daisugi/ayamari](../ayamari) errors

[:top: Back to top](#-table-of-contents)

---

## 📚 API

> [!NOTE]
> The wrappers in this library expect the functions they wrap to return a [@daisugi/anzen](../anzen) `Result` (or a `Promise` of one).

### `withCache(fn, opts?)`

Caches the result of a `Result`-returning function. Successful (and, by default, `NotFound`) responses are stored and replayed on subsequent calls with the same arguments.

```ts
withCache<E, T>(
  fn: AnzenResultFn<E, T>,
  opts?: WithCacheOpts,
): (...args: any[]) => Promise<AnzenAnyResult<E, T>>
```

| Option                   | Type                                | Default                   | Description                                                            |
| ------------------------ | ----------------------------------- | ------------------------- | ---------------------------------------------------------------------- |
| `cacheStore`             | `CacheStore`                        | `new SimpleMemoryStore()` | Backing store implementing the `CacheStore` interface (`get` / `set` / `delete`). |
| `version`                | `string`                            | `'v1'`                    | Version string for cache-key invalidation.                             |
| `maxAgeMs`               | `number`                            | `14400000` (4h)           | Entry time-to-live in milliseconds.                                    |
| `buildCacheKey`          | `(fnHash, version, args) => string` | _see below_               | Builds the cache key from the function hash, version, and arguments.   |
| `calculateCacheMaxAgeMs` | `(maxAgeMs) => number`              | _see below_               | Computes the TTL, adding jitter to avoid synchronized expiry.          |
| `shouldCache`            | `(response) => boolean`             | _see below_               | Decides whether a response should be cached.                           |
| `shouldInvalidateCache`  | `(args) => boolean`                 | _see below_               | Decides whether to evict the cached entry and refresh.                 |

Default implementations:

```js
function buildCacheKey(fnHash, version, args) {
  return `${fnHash}:${version}:${stringifyArgs(args)}`;
}

function calculateCacheMaxAgeMs(maxAgeMs) {
  return randomIntBetween(maxAgeMs * 0.75, maxAgeMs);
}

function shouldCache(response) {
  if (response.isSuccess) return true;
  if (response.isFailure && response.getError().code === Ayamari.errCode.NotFound) return true;
  return false;
}

function shouldInvalidateCache(args) {
  return false;
}
```

The helpers `buildCacheKey`, `calculateCacheMaxAgeMs`, `shouldCache`, and `shouldInvalidateCache` are also exported for customization.

```js
import { withCache } from '@daisugi/kintsugi';
import { Result } from '@daisugi/anzen';

function fnToBeCached() {
  return Result.success('Hi Benadryl Cumberbatch.');
}

const fnWithCache = withCache(fnToBeCached);
fnWithCache();
```

For a custom store example, see [RedisCacheStore](./examples/redis_cache_store.ts).

---

### `withRetry(fn, opts?)`

Retries a `Result`-returning function on failure, using exponential backoff with full jitter.

```ts
withRetry<E, T>(
  fn: AnzenResultFn<E, T>,
  opts?: WithRetryOpts,
): (...args: any[]) => Promise<AnzenAnyResult<E, T>>
```

| Option                  | Type                                                            | Default     | Description                                |
| ----------------------- | --------------------------------------------------------------- | ----------- | ------------------------------------------ |
| `firstDelayMs`          | `number`                                                        | `200`       | Initial retry delay in milliseconds.       |
| `maxDelayMs`            | `number`                                                        | `600`       | Maximum delay in milliseconds.             |
| `timeFactor`            | `number`                                                        | `2`         | Factor for the exponential backoff.        |
| `maxRetries`            | `number`                                                        | `3`         | Maximum number of retry attempts.          |
| `calculateRetryDelayMs` | `(firstDelayMs, maxDelayMs, timeFactor, retryNumber) => number` | _see below_ | Computes the delay before each retry.      |
| `shouldRetry`           | `(response, retryNumber, maxRetries) => boolean`                | _see below_ | Decides whether to retry a given response. |

Default implementations:

```js
function calculateRetryDelayMs(firstDelayMs, maxDelayMs, timeFactor, retryNumber) {
  const delayMs = Math.min(maxDelayMs, firstDelayMs * timeFactor ** retryNumber);
  return randomIntBetween(0, delayMs);
}

const nonRetryableErrCodes = [Ayamari.errCode.NotFound];

function shouldRetry(response, retryNumber, maxRetries) {
  if (response.isFailure) {
    if (nonRetryableErrCodes.includes(response.getError().code)) return false;
    if (retryNumber < maxRetries) return true;
  }
  return false;
}
```

The helpers `calculateRetryDelayMs` and `shouldRetry` are also exported for customization.

```js
import { withRetry } from '@daisugi/kintsugi';
import { Result } from '@daisugi/anzen';

function fn() {
  return Result.success('Hi Benadryl Cumberbatch.');
}

const fnWithRetry = withRetry(fn);
fnWithRetry();
```

---

### `withTimeout(fn, opts?)`

Races a function against a timeout. If the function does not settle in time, it resolves to a `Result.failure` carrying an Ayamari `Timeout` (504) error.

```ts
withTimeout<Fn extends AsyncFn>(
  fn: Fn,
  opts?: { maxTimeMs?: number },
): (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>> | AnzenResultFailure<AyamariErr>>
```

| Option      | Type     | Default | Description                                          |
| ----------- | -------- | ------- | ---------------------------------------------------- |
| `maxTimeMs` | `number` | `600`   | Maximum wait time in milliseconds before timing out. |

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

---

### `withPool(fn, opts?)` / `createWithPool(opts?)`

Limits the number of concurrent executions of an async function. `withPool` wraps a single function with its own pool; `createWithPool` builds a shared pool that multiple functions can join, so they collectively respect one concurrency limit.

```ts
withPool<Fn extends AsyncFn>(
  fn: Fn,
  opts?: { concurrencyCount?: number },
): (...args: Parameters<Fn>) => ReturnType<Fn>

createWithPool(
  opts?: { concurrencyCount?: number },
): { withPool: <Fn extends AsyncFn>(fn: Fn) => Fn }
```

| Option             | Type     | Default | Description                                          |
| ------------------ | -------- | ------- | ---------------------------------------------------- |
| `concurrencyCount` | `number` | `2`     | Maximum number of executions allowed to run at once. |

```js
import { withPool, createWithPool } from '@daisugi/kintsugi';

// Per-function pool.
const pooledFn = withPool(asyncFn, { concurrencyCount: 2 });

// Shared pool across multiple functions.
const { withPool: poolWith } = createWithPool({ concurrencyCount: 2 });
const pooledA = poolWith(asyncFnA);
const pooledB = poolWith(asyncFnB);
```

---

### `reusePromise(fn)`

Prevents an async function from running concurrently with the same arguments by caching the in-flight promise until it settles.

```ts
reusePromise<Fn extends AsyncFn>(
  fn: Fn,
): (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>>>
```

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

---

### `waitFor(delayMs)`

Creates a promise that resolves after the given delay. Handy for spacing out work or simulating latency.

```ts
waitFor(delayMs: number): Promise<void>
```

| Parameter | Type     | Description                                        |
| --------- | -------- | -------------------------------------------------- |
| `delayMs` | `number` | Delay in milliseconds before the promise resolves. |

```js
import { waitFor } from '@daisugi/kintsugi';

async function fn() {
  await waitFor(1000);
}

fn();
```

---

### `SimpleMemoryStore`

A basic in-memory cache store implementing the `CacheStore` interface. Every method returns an [@daisugi/anzen](../anzen) `Result`; a missing key yields an Ayamari `NotFound` failure. When `maxAgeMs` is provided, the entry expires (and is treated as a miss) once that many milliseconds have elapsed; when omitted, the entry never expires. The store is bounded by `maxSize` (default `1000`) and evicts the least-recently-used entry once it is full, so it stays safe for long-lived processes.

```ts
class SimpleMemoryStore implements CacheStore {
  constructor(opts?: { maxSize?: number });
  get(cacheKey: string): AnzenAnyResult<AyamariErr, unknown>;
  set(
    cacheKey: string,
    value: unknown,
    maxAgeMs?: number,
  ): AnzenResultSuccess<string>;
  delete(cacheKey: string): AnzenResultSuccess<string>;
}
```

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

---

### `deferredPromise()`

Implements the deferred pattern: a promise plus externally callable `resolve` / `reject` and state inspectors.

```ts
deferredPromise<T = unknown>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
  isFulfilled(): boolean;
  isPending(): boolean;
  isRejected(): boolean;
}
```

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

---

### `randomIntBetween(min, max)`

Returns a random integer between `min` and `max`, inclusive.

```ts
randomIntBetween(min: number, max: number): number
```

| Parameter | Type     | Description              |
| --------- | -------- | ------------------------ |
| `min`     | `number` | Lower bound (inclusive). |
| `max`     | `number` | Upper bound (inclusive). |

```js
import { randomIntBetween } from '@daisugi/kintsugi';

const randomNumber = randomIntBetween(100, 200);
// A random integer between 100 and 200.
```

---

### `hashFNV1A(input)`

A fast, non-cryptographic 32-bit [FNV-1a](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function) hash. Useful for cache keys, not for security.

```ts
hashFNV1A(input: string | Uint8Array): number
```

| Parameter | Type                   | Description    |
| --------- | ---------------------- | -------------- |
| `input`   | `string \| Uint8Array` | Value to hash. |

```js
import { hashFNV1A } from '@daisugi/kintsugi';

const hash = hashFNV1A(JSON.stringify({ name: 'Hi Benadryl Cumberbatch.' }));
```

[:top: Back to top](#-table-of-contents)

---

## 🌸 Etymology

*Kintsugi* (金継ぎ) is the Japanese art of repairing broken objects by mending the cracks with gold, highlighting rather than hiding the damage—much like how Kintsugi keeps services running gracefully through failures.

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
