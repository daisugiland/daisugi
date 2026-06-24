# @daisugi/kintsugi

[![version](https://img.shields.io/npm/v/@daisugi/kintsugi.svg)](https://www.npmjs.com/package/@daisugi/kintsugi)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/kintsugi)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/kintsugi)](https://bundlephobia.com/result?p=@daisugi/kintsugi)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Kintsugi** is a set of utilities for building fault-tolerant services.

---

## ✨ Features

- 💡 Minimal size overhead ([details](https://bundlephobia.com/result?p=@daisugi/kintsugi))
- ⚡️ Written in TypeScript
- 📦 Uses only trusted dependencies
- 🔨 Powerful and agnostic to your code
- 🧪 Well-tested
- 🤝 Used in production
- 🌳 Tree-shakeable
- 🌐 Universal - runs in the browser and on the server (Node.js)
- 🔀 Supports both ES Modules and CommonJS

---

## 🚀 Usage

Wrap a function with the resilience helpers you need. They stack in any order.

```js
import {
  reusePromise,
  waitFor,
  withCache,
  withRetry,
} from '@daisugi/kintsugi';
import { ok } from '@daisugi/anzen';

async function fn() {
  await waitFor(1000);
  return ok('Hi Benadryl Cumberbatch.');
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
      - [Adapting a throwing function](#adapting-a-throwing-function)
    - [`withCache(fn, opts?)`](#withcachefn-opts)
    - [`withMemo(fn, opts?)`](#withmemofn-opts)
    - [`withRetry(fn, opts?)`](#withretryfn-opts)
    - [`withTimeout(fn, opts?)`](#withtimeoutfn-opts)
    - [`withPool(fn, opts?)` / `createWithPool(opts?)`](#withpoolfn-opts--createwithpoolopts)
    - [`reusePromise(fn)`](#reusepromisefn)
    - [`waitFor(delayMs)`](#waitfordelayms)
    - [`SimpleMemoryStore`](#simplememorystore)
    - [`deferredPromise()`](#deferredpromise)
    - [`randomIntBetween(min, max)`](#randomintbetweenmin-max)
    - [`hashFNV1A(input)`](#hashfnv1ainput)
    - [`stringifyArgs(args)`](#stringifyargsargs)
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

Kintsugi wraps your functions with resilience patterns, so one slow or failing dependency does not take down your service.

It provides:

- ✅ Result-based caching with TTL, jitter, and pluggable stores (`withCache`)
- ✅ One-call async memoization: cache plus de-duplication (`withMemo`)
- ✅ Retries with exponential backoff and jitter (`withRetry`)
- ✅ Per-call timeouts (`withTimeout`)
- ✅ Concurrency limiting via pools (`withPool`)
- ✅ In-flight promise de-duplication (`reusePromise`)
- ✅ Promise helpers (`waitFor`, `deferredPromise`)
- ✅ A bounded (LRU) in-memory store (`SimpleMemoryStore`)
- ✅ Small utilities (`randomIntBetween`, `hashFNV1A`, `stringifyArgs`)
- ✅ Built on [@daisugi/anzen](../anzen) Results and [@daisugi/ayamari](../ayamari) errors

[:top: Back to top](#-table-of-contents)

---

## 📚 API

> [!NOTE]
> **Error model.** Each wrapper takes an async function that returns an [@daisugi/anzen](../anzen) `Result` and returns a wrapper with the same shape. Failures travel as a failure `Result`, not as thrown exceptions. A thrown error is treated as a bug. Because the shape in and out is the same, the wrappers compose in any order.

#### Adapting a throwing function

If a function throws instead of returning a `Result`, wrap it once with anzen's `fromAsyncThrowable`, then compose freely.

```ts
import { fromAsyncThrowable } from '@daisugi/anzen';
import { withCache, withRetry, withTimeout } from '@daisugi/kintsugi';

// Inner to outer: time-box each attempt, retry failures, cache the success.
const getUser = withCache(withRetry(withTimeout(fromAsyncThrowable(fetchUser))));
```

Pass a `parseErr` to turn thrown errors into a typed [@daisugi/ayamari](../ayamari) error, so `withRetry` can branch on the code: `fromAsyncThrowable(fetchUser, (e) => ...)`.

Order matters: `withTimeout` bounds each attempt, `withRetry` retries failures, and `withCache` stores the final success.

### `withCache(fn, opts?)`

Caches the result of a `Result`-returning function. Successful (and, by default, `NotFound`) responses are replayed for the same arguments.

```ts
withCache<E, T>(
  fn: AnzenResultFn<E, T>,
  opts?: WithCacheOpts,
): (...args: any[]) => Promise<AnzenResult<E, T>>
```

| Option                   | Type                              | Default                   | Description                                          |
| ------------------------ | --------------------------------- | ------------------------- | ---------------------------------------------------- |
| `cacheStore`             | `CacheStore`                      | `new SimpleMemoryStore()` | Backing store (`get` / `set` / `delete`).           |
| `version`                | `string`                          | `'v1'`                    | Version string for cache-key invalidation.          |
| `maxAgeMs`               | `number`                          | `14400000` (4h)           | Entry time-to-live in milliseconds.                 |
| `buildCacheKey`          | `(fnId, version, args) => string` | _see below_               | Builds the cache key.                               |
| `calculateCacheMaxAgeMs` | `(maxAgeMs) => number`            | _see below_               | Computes the TTL, adding jitter.                    |
| `shouldCache`            | `(response) => boolean`           | _see below_               | Decides whether to cache a response.               |
| `shouldInvalidateCache`  | `(args) => boolean`               | _see below_               | Decides whether to evict and refresh.              |

Default implementations:

```js
function buildCacheKey(fnId, version, args) {
  return `${fnId}:${version}:${stringifyArgs(args)}`;
}

function calculateCacheMaxAgeMs(maxAgeMs) {
  return randomIntBetween(maxAgeMs * 0.75, maxAgeMs);
}

function shouldCache(response) {
  if (response.isOk) return true;
  if (response.isErr && response.unwrapErr().code === Ayamari.errCode.NotFound) return true;
  return false;
}

function shouldInvalidateCache(args) {
  return false;
}
```

`buildCacheKey`, `calculateCacheMaxAgeMs`, `shouldCache`, and `shouldInvalidateCache` are also exported, so you can reuse or replace them.

```js
import { withCache } from '@daisugi/kintsugi';
import { ok } from '@daisugi/anzen';

function fnToBeCached() {
  return ok('Hi Benadryl Cumberbatch.');
}

const fnWithCache = withCache(fnToBeCached);
fnWithCache();
```

For a custom store example, see [RedisCacheStore](./examples/redis_cache_store.ts).

---

### `withMemo(fn, opts?)`

Memoizes an async function in one call. It caches results (LRU) and shares a single in-flight run across callers with the same arguments, so a cold cache won't cause a stampede.

```ts
withMemo<Fn extends AsyncFn>(
  fn: Fn,
  opts?: WithCacheOpts & { maxSize?: number },
): (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>>>
```

`maxSize` caps the default store (ignored when you pass your own `cacheStore`). All other options match [`withCache`](#withcachefn-opts).

```ts
import { withMemo } from '@daisugi/kintsugi';

const getUser = withMemo(fetchUser, { maxSize: 500, maxAgeMs: 60000 });

// Concurrent calls with the same id share one fetch; the result is cached.
const [a, b] = await Promise.all([getUser(1), getUser(1)]);
```

---

### `withRetry(fn, opts?)`

Retries a `Result`-returning function on failure, using exponential backoff with jitter.

```ts
withRetry<E, T>(
  fn: AnzenResultFn<E, T>,
  opts?: WithRetryOpts,
): (...args: any[]) => Promise<AnzenResult<E, T>>
```

| Option                  | Type                                                            | Default     | Description                          |
| ----------------------- | --------------------------------------------------------------- | ----------- | ------------------------------------ |
| `firstDelayMs`          | `number`                                                        | `200`       | Initial retry delay in ms.           |
| `maxDelayMs`            | `number`                                                        | `600`       | Maximum delay in ms.                 |
| `timeFactor`            | `number`                                                        | `2`         | Backoff factor.                      |
| `maxRetries`            | `number`                                                        | `3`         | Maximum retry attempts.              |
| `calculateRetryDelayMs` | `(firstDelayMs, maxDelayMs, timeFactor, retryNumber) => number` | _see below_ | Computes the delay before each retry. |
| `shouldRetry`           | `(response, retryNumber, maxRetries) => boolean`                | _see below_ | Decides whether to retry.            |

Default implementations:

```js
function calculateRetryDelayMs(firstDelayMs, maxDelayMs, timeFactor, retryNumber) {
  const delayMs = Math.min(maxDelayMs, firstDelayMs * timeFactor ** retryNumber);
  return randomIntBetween(0, delayMs);
}

const nonRetryableErrCodes = [Ayamari.errCode.NotFound];

function shouldRetry(response, retryNumber, maxRetries) {
  if (response.isErr) {
    if (nonRetryableErrCodes.includes(response.unwrapErr().code)) return false;
    if (retryNumber < maxRetries) return true;
  }
  return false;
}
```

`calculateRetryDelayMs` and `shouldRetry` are also exported, so you can reuse or replace them.

```js
import { withRetry } from '@daisugi/kintsugi';
import { ok } from '@daisugi/anzen';

function fn() {
  return ok('Hi Benadryl Cumberbatch.');
}

const fnWithRetry = withRetry(fn);
fnWithRetry();
```

---

### `withTimeout(fn, opts?)`

Races a `Result`-returning function against a timeout. If it does not settle in time, it resolves to a failure `Result` with an Ayamari `Timeout` (504) error.

```ts
withTimeout<Fn extends AnzenResultFn<unknown, unknown>>(
  fn: Fn,
  opts?: { maxTimeMs?: number },
): (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>> | AnzenResultErr<AyamariErr>>
```

| Option      | Type     | Default | Description                          |
| ----------- | -------- | ------- | ------------------------------------ |
| `maxTimeMs` | `number` | `600`   | Maximum wait time in ms.             |

> **Note:** This is the most expensive wrapper per call. Use it on calls that can really hang (I/O, network), not on hot in-process calls that rarely block.

```js
import { withTimeout, waitFor } from '@daisugi/kintsugi';
import { ok } from '@daisugi/anzen';

async function fn() {
  await waitFor(8000);
  return ok('Hi Benadryl Cumberbatch.');
}

const fnWithTimeout = withTimeout(fn);
fnWithTimeout();
```

---

### `withPool(fn, opts?)` / `createWithPool(opts?)`

Limits how many calls of an async function run at once. `withPool` gives one function its own pool. `createWithPool` builds a shared pool that several functions can join.

```ts
withPool<Fn extends AsyncFn>(
  fn: Fn,
  opts?: { concurrencyCount?: number },
): (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>>>

createWithPool(opts?: { concurrencyCount?: number }): {
  withPool<Fn extends AsyncFn>(
    fn: Fn,
  ): (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>>>;
}
```

| Option             | Type     | Default | Description                          |
| ------------------ | -------- | ------- | ------------------------------------ |
| `concurrencyCount` | `number` | `2`     | Maximum calls allowed at once.       |

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

Stops an async function from running twice at once for the same arguments. It reuses the in-flight promise until it settles.

```ts
reusePromise<Fn extends AsyncFn>(
  fn: Fn,
): (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>>>
```

```js
import { reusePromise, waitFor } from '@daisugi/kintsugi';
import { ok } from '@daisugi/anzen';

async function fnToBeReused() {
  await waitFor(1000);
  return ok('Hi Benadryl Cumberbatch.');
}

const fn = reusePromise(fnToBeReused);

fn(); // Runs the function and waits for the response.
fn(); // Reuses the ongoing promise.
```

---

### `waitFor(delayMs)`

Returns a promise that resolves after the given delay.

```ts
waitFor(delayMs: number): Promise<void>
```

| Parameter | Type     | Description                          |
| --------- | -------- | ------------------------------------ |
| `delayMs` | `number` | Delay in ms before resolving.        |

```js
import { waitFor } from '@daisugi/kintsugi';

async function fn() {
  await waitFor(1000);
}

fn();
```

---

### `SimpleMemoryStore`

A simple in-memory cache store. Every method returns an [@daisugi/anzen](../anzen) `Result`, and a missing key yields an Ayamari `NotFound` failure.

Entries expire after `maxAgeMs` (or never, if omitted). The store is bounded by `maxSize` (default `1000`) and evicts the least-recently-used entry when full.

```ts
class SimpleMemoryStore implements CacheStore {
  constructor(opts?: { maxSize?: number });
  get(cacheKey: string): AnzenResult<AyamariErr, unknown>;
  set(
    cacheKey: string,
    value: unknown,
    maxAgeMs?: number,
  ): AnzenResultOk<string>;
  delete(cacheKey: string): AnzenResultOk<string>;
}
```

```js
import { SimpleMemoryStore } from '@daisugi/kintsugi';

const simpleMemoryStore = new SimpleMemoryStore();

simpleMemoryStore.set('key', 'Benadryl Cumberbatch.');

const response = simpleMemoryStore.get('key');

if (response.isOk) {
  console.log(response.unwrap());
  // 'Benadryl Cumberbatch.'
}
```

---

### `deferredPromise()`

Returns a promise plus external `resolve` / `reject` and state inspectors.

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

A fast, non-cryptographic 32-bit [FNV-1a](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function) hash. Good for cache keys, not for security.

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

### `stringifyArgs(args)`

Turns an argument list into a stable string for use as a cache key.

A single primitive (`null`, number, boolean) becomes a bare token. Everything else is JSON-serialized as an array, with object keys sorted.

```ts
stringifyArgs(args: unknown[]): string
```

| Parameter | Type        | Description                    |
| --------- | ----------- | ------------------------------ |
| `args`    | `unknown[]` | The arguments array to encode. |

```js
import { stringifyArgs } from '@daisugi/kintsugi';

stringifyArgs([42]);               // "42"
stringifyArgs([true]);             // "true"
stringifyArgs([null]);             // "null"
stringifyArgs(['hello']);          // '["hello"]'
stringifyArgs([1, 2]);             // "[1,2]"
stringifyArgs([{ b: 2, a: 1 }]);   // '[{"a":1,"b":2}]'
stringifyArgs([[5, 5]]);           // "[[5,5]]"  - array arg, not two args
```

[:top: Back to top](#-table-of-contents)

---

## 🌸 Etymology

*Kintsugi* (金継ぎ) is the Japanese art of repairing broken objects with gold, highlighting the cracks rather than hiding them. Much like how Kintsugi keeps services running through failures.

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
