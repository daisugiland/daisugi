# @daisugi/anzen

[![version](https://img.shields.io/npm/v/@daisugi/anzen.svg)](https://www.npmjs.com/package/@daisugi/anzen)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/anzen)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/anzen)](https://bundlephobia.com/result?p=@daisugi/anzen)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Anzen** - a `Result` type for safe error handling without exceptions, inspired by Rust and Haskell.

---

## ✨ Features

- 💡 Minimal size overhead ([details](https://bundlephobia.com/result?p=@daisugi/anzen))
- ⚡️ Written in TypeScript
- 📦 Uses only trusted dependencies
- 🔨 Powerful and agnostic to your code
- 🧪 Well-tested
- 🤝 Used in production by millions of users
- 🌳 Tree-shakeable
- 🌐 Universal - runs in the browser and on the server (Node.js)
- 🔀 Supports both ES Modules and CommonJS

---

## 🚀 Usage

```js
import { ok, err } from '@daisugi/anzen';
import { readFileSync } from 'node:fs';

function readFile(path) {
  try {
    const response = readFileSync(path);
    return ok(response);
  } catch (error) {
    return err(error);
  }
}

const result = readFile('test.txt');

if (result.isErr) {
  return result.unwrapErr();
}

return result.unwrap();
```

Every combinator is a standalone named export, so unused helpers are tree-shaken away — `import { ok }` pulls in nothing else.

---

## 📖 Table of Contents

- [@daisugi/anzen](#daisugianzen)
  - [✨ Features](#-features)
  - [🚀 Usage](#-usage)
  - [📖 Table of Contents](#-table-of-contents)
  - [📦 Installation](#-installation)
  - [🔍 Overview](#-overview)
  - [🎯 Motivation](#-motivation)
  - [📚 API](#-api)
    - [`ok(value)`](#okvalue)
    - [`err(error)`](#errerror)
    - [`isAnzenResult(value)`](#isanzenresultvalue)
    - [`result.isOk / result.isErr`](#resultisok--resultiserr)
    - [`result.unwrap()`](#resultunwrap)
    - [`result.unwrapErr()`](#resultunwraperr)
    - [`result.unwrapOr(defaultValue)`](#resultunwrapordefaultvalue)
    - [`result.map(fn)`](#resultmapfn)
    - [`result.andThen(fn)`](#resultandthenfn)
    - [`result.orElse(fn)`](#resultorelsefn)
    - [`result.mapErr(fn)`](#resultmaperrfn)
    - [`result.toTuple(defaultValue?)`](#resulttotupledefaultvalue)
    - [`result.toJSON()`](#resulttojson)
    - [`fromJSON(json)`](#fromjsonjson)
    - [`promiseAll(results)`](#promiseallresults)
    - [`unwrapPromiseAll([defaults, ...results])`](#unwrappromisealldefaults-results)
    - [`toTuple(defaultValue?)`](#totupledefaultvalue)
    - [`fromAsyncThrowable(fn, parseErr?)`](#fromasyncthrowablefn-parseerr)
    - [`fromThrowable(fn, parseErr?)`](#fromthrowablefn-parseerr)
    - [`wrapAsyncThrowable(fn, parseErr?)`](#wrapasyncthrowablefn-parseerr)
    - [`ResultAsync<E, T>`](#resultasynce-t)
    - [`okAsync(value)` / `errAsync(error)`](#okasyncvalue--errasyncerror)
    - [`fromPromise(promise, parseErr?)`](#frompromisepromise-parseerr)
    - [`fromSafePromise(promise)`](#fromsafepromisepromise)
  - [🔷 TypeScript Support](#-typescript-support)
  - [🎯 Goal](#-goal)
  - [🌍 Other Projects](#-other-projects)
  - [📜 License](#-license)

---

## 📦 Installation

Using npm:

```sh
npm install @daisugi/anzen
```

Using pnpm:

```sh
pnpm install @daisugi/anzen
```

[:top: Back to top](#-table-of-contents)

---

## 🔍 Overview

**Anzen** replaces thrown exceptions with an explicit `Result` type, making error paths visible in function signatures and composable with standard transforms. It provides:

- ✅ `ok` and `err` constructors for wrapping values and errors
- ✅ Chainable `.map` / `.andThen` transforms for Ok paths
- ✅ Mirror `.mapErr` / `.orElse` transforms for Err paths
- ✅ Async helpers: `promiseAll`, `fromAsyncThrowable`, and a chainable `ResultAsync` (`okAsync` / `errAsync` / `fromPromise`)
- ✅ JSON serialization and deserialization
- ✅ TypeScript-first with full type inference on all operations
- ✅ Integration with [@daisugi/ayamari](../ayamari) for rich, structured error objects

[:top: Back to top](#-table-of-contents)

---

## 🎯 Motivation

Anzen was created to provide a simple and predictable way to handle errors, eliminating unexpected exceptions. It is especially useful when:

- Early failures need to be caught and handled at the call site.
- You prefer a clean, chainable style of error handling over try/catch blocks.
- You require improved TypeScript support with typed error and value paths.
- You want a minimal API that covers common use cases without mimicking other languages' patterns entirely.

If you are looking for a robust Result-pattern implementation, Anzen might be the right choice. Alternatives include [True-Myth](https://true-myth.js.org/) or [Folktale](https://folktale.origamitower.com/).

[:top: Back to top](#-table-of-contents)

---

## 📚 API

A `Result` instance is either a `ResultOk<T>` or a `ResultErr<E>`. The standalone `ok` / `err` / `fromJSON` / `promiseAll` / `unwrapPromiseAll` / `toTuple` / `fromAsyncThrowable` / `fromThrowable` exports create or combine instances; instance methods transform or extract values.

### `ok(value)`

Creates a successful Result wrapping the given value.

```ts
ok<T>(value: T): ResultOk<T>
```

| Parameter | Type | Description           |
| --------- | ---- | --------------------- |
| `value`   | `T`  | The Ok value to wrap. |

```js
import { ok } from '@daisugi/anzen';

const res = ok('foo');
```

---

### `err(error)`

Creates an Err Result wrapping the given error.

```ts
err<E>(error: E): ResultErr<E>
```

| Parameter | Type | Description              |
| --------- | ---- | ------------------------ |
| `error`   | `E`  | The error value to wrap. |

```js
import { err } from '@daisugi/anzen';

const res = err('err');
```

---

### `isAnzenResult(value)`

Type guard that narrows an `unknown` value to a `Result`. It checks a
registry-global brand (`Symbol.for('@daisugi/anzen')`) stamped on every
Result, so it stays reliable across realms/bundles where `instanceof`
would fail (e.g. when more than one copy of the package is loaded).

```ts
isAnzenResult(value: unknown): value is ResultOk<unknown> | ResultErr<unknown>
```

| Parameter | Type      | Description        |
| --------- | --------- | ------------------ |
| `value`   | `unknown` | The value to test. |

```js
import { ok, isAnzenResult } from '@daisugi/anzen';

isAnzenResult(ok('foo')); // true
isAnzenResult({ isOk: true }); // false (not branded)
```

---

### `result.isOk / result.isErr`

Boolean properties that indicate whether the Result represents an Ok or an Err. Exactly one is `true` at any time.

```js
import { ok, err } from '@daisugi/anzen';

const res = ok('foo');
console.log(res.isOk); // true
console.log(res.isErr); // false

const errRes = err('err');
console.log(errRes.isOk); // false
console.log(errRes.isErr); // true
```

---

### `result.unwrap()`

Returns the Ok value. Throws if the Result is an Err — guard with `result.isOk` or use `unwrapOr` for a safe alternative.

```ts
result.unwrap(): T
```

```js
import { ok } from '@daisugi/anzen';

const value = ok('foo').unwrap();
// 'foo'
```

---

### `result.unwrapErr()`

Returns the error value. Throws if the Result is an Ok — guard with `result.isErr`.

```ts
result.unwrapErr(): E
```

```js
import { err } from '@daisugi/anzen';

const error = err('err').unwrapErr();
// 'err'
```

---

### `result.unwrapOr(defaultValue)`

Returns the Ok value, or `defaultValue` if the Result is an Err. Never throws.

```ts
result.unwrapOr<V>(defaultValue: V): T | V
```

| Parameter      | Type | Description                     |
| -------------- | ---- | ------------------------------- |
| `defaultValue` | `V`  | Fallback value returned on Err. |

```js
import { err } from '@daisugi/anzen';

const value = err('err').unwrapOr('foo');
// 'foo'
```

---

### `result.map(fn)`

Applies `fn` to the Ok value and wraps the return in a new Ok Result. Passes through unchanged on Err.

```ts
result.map<V>(fn: (value: T) => V): ResultOk<V> | ResultErr<E>
```

| Parameter | Type              | Description                        |
| --------- | ----------------- | ---------------------------------- |
| `fn`      | `(value: T) => V` | Transform applied to the Ok value. |

```js
import { ok } from '@daisugi/anzen';

const result = ok('foo')
  .map((value) => value)
  .unwrap();
// 'foo'
```

---

### `result.andThen(fn)`

Applies `fn` to the Ok value, where `fn` returns a new `Result`. Passes through unchanged on Err. Useful for sequencing operations that may themselves fail.

```ts
result.andThen<V, F>(fn: (value: T) => AnzenResult<F, V>): AnzenResult<E | F, V>
```

| Parameter | Type                   | Description                                            |
| --------- | ---------------------- | ------------------------------------------------------ |
| `fn`      | `(value: T) => Result` | Function that produces a new Result from the Ok value. |

```js
import { ok } from '@daisugi/anzen';

const result = ok('foo')
  .andThen((value) => ok(value))
  .unwrap();
// 'foo'
```

---

### `result.orElse(fn)`

For an Err Result, applies `fn` to the error value, where `fn` returns a new Result. Passes through unchanged on Ok. Useful for recovering from errors.

```ts
result.orElse<V, F>(fn: (err: E) => AnzenResult<F, V>): AnzenResult<F, T | V>
```

| Parameter | Type                 | Description                                                    |
| --------- | -------------------- | -------------------------------------------------------------- |
| `fn`      | `(err: E) => Result` | Function that produces a recovery Result from the error value. |

```js
import { ok, err } from '@daisugi/anzen';

const result = err('err')
  .orElse((err) => ok('foo'))
  .unwrap();
// 'foo'
```

---

### `result.mapErr(fn)`

For an Err Result, transforms the error value using `fn` and wraps the return in a new Ok Result. Passes through unchanged on Ok.

```ts
result.mapErr<V>(fn: (err: E) => V): ResultOk<T | V>
```

| Parameter | Type            | Description                           |
| --------- | --------------- | ------------------------------------- |
| `fn`      | `(err: E) => V` | Transform applied to the error value. |

```js
import { err } from '@daisugi/anzen';

const result = err('err')
  .mapErr((err) => 'foo')
  .unwrap();
// 'foo'
```

---

### `result.toTuple(defaultValue?)`

Returns a tuple `[result, value]`. On Ok, the second element is the wrapped value. On Err, the second element is `defaultValue` (or `undefined` if omitted).

```ts
// On ResultOk — no argument needed:
result.toTuple(): [ResultOk<T>, T]

// On ResultErr — optional default:
result.toTuple<V>(defaultValue?: V): [ResultErr<E>, V]
```

| Parameter      | Type | Description                                                       |
| -------------- | ---- | ----------------------------------------------------------------- |
| `defaultValue` | `V`  | Value used as the second tuple element when the Result is an Err. |

```js
import { ok, err } from '@daisugi/anzen';

const [res, value] = ok('foo').toTuple();
// res is the ResultOk instance, value is 'foo'

const [errRes, output] = err('err').toTuple('foo');
// errRes is the ResultErr instance, output is 'foo'
```

---

### `result.toJSON()`

Serializes the Result to a JSON string.

```ts
result.toJSON(): string
```

```js
import { ok, err } from '@daisugi/anzen';

ok('foo').toJSON();
// '{"value":"foo","isOk":true}'

err('err').toJSON();
// '{"error":"err","isOk":false}'
```

---

### `fromJSON(json)`

Deserializes a JSON string (as produced by `toJSON`) into a Result instance.

```ts
fromJSON<E = unknown, T = unknown>(json: string): AnzenResult<E, T>
```

| Parameter | Type     | Description                                    |
| --------- | -------- | ---------------------------------------------- |
| `json`    | `string` | A JSON string previously produced by `toJSON`. |

```js
import { fromJSON } from '@daisugi/anzen';

const value = fromJSON('{"value":"foo","isOk":true}').unwrap();
// 'foo'
```

---

### `promiseAll(results)`

Runs an array of Results or Promises of Results in parallel. Returns an Ok Result containing an array of all values if every entry succeeds, or the first Err encountered. The failure branch is typed `unknown` because a wrapped Promise may reject with anything; use `fromAsyncThrowable`/`fromPromise` with a `parseErr` upstream if you need a typed error.

```ts
promiseAll<T extends (AnzenResult<unknown, unknown> | Promise<AnzenResult<unknown, unknown>>)[]>(
  whenRes: T,
): Promise<AnzenResultOk<ExtractOk<T>> | AnzenResultErr<unknown>>
```

| Parameter | Type                            | Description                                        |
| --------- | ------------------------------- | -------------------------------------------------- |
| `whenRes` | `(Result \| Promise<Result>)[]` | Results or Promises of Results to run in parallel. |

```js
import { ok, promiseAll } from '@daisugi/anzen';

const result = await promiseAll([
  ok('foo'),
  Promise.resolve(ok('bar')),
]);

result.unwrap(); // ['foo', 'bar']
```

On Err:

```js
import { err, promiseAll } from '@daisugi/anzen';

const result = await promiseAll([
  err('err'),
]);

result.unwrapErr(); // 'err'
```

---

### `unwrapPromiseAll([defaults, ...results])`

Runs an array of Results or Promises of Results in parallel and unwraps them. The first element of the returned tuple is a Result representing the overall outcome; the remaining elements are the individual unwrapped values (or the defaults on Err).

```ts
unwrapPromiseAll<T extends (AnzenResult<unknown, unknown> | Promise<AnzenResult<unknown, unknown>>)[]>(
  args: [ExtractOk<T>, ...T],
): Promise<[AnzenResultOk<ExtractOk<T>> | AnzenResultErr<unknown>, ...ExtractOk<T>]>
```

| Parameter    | Type                        | Description                                                                                                                                                   |
| ------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `args[0]`    | `ExtractOk<T>`              | A **full-length** tuple of default values, returned as the remaining tuple elements on Err. Each default is type-checked against the corresponding Ok value type. A partial/short tuple is a type error: on Err it is spread into the value positions, so a missing default would leave an `undefined` the return type claims is a present value. |
| `args[1..n]` | `Result \| Promise<Result>` | Results or Promises of Results to run in parallel.                                                                                                            |

```js
import { ok, unwrapPromiseAll } from '@daisugi/anzen';

const [res, val1, val2] = await unwrapPromiseAll([
  ['', ''], // one default per result
  ok('foo'),
  Promise.resolve(ok('bar')),
]);

res.isOk; // true
val1; // 'foo'
val2; // 'bar'
```

---

### `toTuple(defaultValue?)`

Returns a function that unpacks a Result into a tuple `[result, value]`, for use as a `.then()` callback. The second element is the Ok value, or `defaultValue` on Err.

```ts
toTuple<V>(defaultValue?: V): (result: AnzenResult<unknown, unknown>) => [AnzenResult<unknown, unknown>, unknown | V]
```

| Parameter      | Type | Description                                    |
| -------------- | ---- | ---------------------------------------------- |
| `defaultValue` | `V`  | Value used as the second tuple element on Err. |

```js
import { err, toTuple } from '@daisugi/anzen';

const fn = async () => err('err');
const [res, output] = await fn().then(toTuple('foo'));
// res is the Err instance, output is 'foo'
```

---

### `fromAsyncThrowable(fn, parseErr?)`

Executes an async function that may throw. Returns an Ok Result with the resolved value, or an Err Result with the error passed through `parseErr`.

```ts
fromAsyncThrowable<E = unknown, T = unknown>(
  fn: () => Promise<T>,
  parseErr?: (err: unknown) => E,
): Promise<AnzenResult<E, T>>
```

| Parameter  | Type                  | Description                                   |
| ---------- | --------------------- | --------------------------------------------- |
| `fn`       | `() => Promise<T>`    | Async function to execute.                    |
| `parseErr` | `(err: unknown) => E` | Optional transform applied to a caught error. |

```js
import { fromAsyncThrowable } from '@daisugi/anzen';

const result = await fromAsyncThrowable(
  async () => { throw new Error('err') },
  (err) => err.message,
);

result.unwrapErr(); // 'err'
```

---

### `fromThrowable(fn, parseErr?)`

Same as `fromAsyncThrowable`, but for synchronous functions.

```ts
fromThrowable<E = unknown, T = unknown>(
  fn: () => T,
  parseErr?: (err: unknown) => E,
): AnzenResult<E, T>
```

| Parameter  | Type                  | Description                                   |
| ---------- | --------------------- | --------------------------------------------- |
| `fn`       | `() => T`             | Synchronous function to execute.              |
| `parseErr` | `(err: unknown) => E` | Optional transform applied to a caught error. |

```js
import { fromThrowable } from '@daisugi/anzen';

const result = fromThrowable(
  () => { throw new Error('err') },
  (err) => err.message,
);

result.unwrapErr(); // 'err'
```

[:top: Back to top](#-table-of-contents)

---

### `wrapAsyncThrowable(fn, parseErr?)`

The lazy counterpart of `fromAsyncThrowable`: adapts an async function that may throw or reject into a reusable Result-returning function (an `AnzenResultFn`), preserving its parameters. Lift a throwing function once and reuse it — e.g. behind `@daisugi/kintsugi` wrappers — instead of wrapping each call in `fromAsyncThrowable`.

```ts
wrapAsyncThrowable<A extends readonly unknown[], T, E = unknown>(
  fn: (...args: A) => Promise<T>,
  parseErr?: (err: unknown) => E,
): (...args: A) => Promise<AnzenResult<E, T>>
```

| Parameter  | Type                         | Description                                   |
| ---------- | ---------------------------- | --------------------------------------------- |
| `fn`       | `(...args: A) => Promise<T>` | Async function to adapt.                       |
| `parseErr` | `(err: unknown) => E`        | Optional transform applied to a caught error. |

```js
import { wrapAsyncThrowable } from '@daisugi/anzen';

const fetchUserResult = wrapAsyncThrowable(fetchUser, (err) => err.message);

const res = await fetchUserResult(42);
if (res.isOk) console.log(res.unwrap());
```

[:top: Back to top](#-table-of-contents)

---

### `ResultAsync<E, T>`

A thenable that carries the Result combinators across an async boundary, so I/O-heavy code can keep chaining instead of awaiting and re-wrapping at every step. `await`-ing an `ResultAsync` yields the underlying `Result`. Built with `okAsync` / `errAsync` / `fromPromise` / `fromSafePromise`.

It mirrors the synchronous combinators — `map`, `mapErr`, `andThen`, `orElse` — whose callbacks may be sync or async, plus the awaitable terminals `unwrap()` / `unwrapErr()` / `unwrapOr(defaultValue)` (each returns a `Promise`).

```ts
class ResultAsync<E, T> implements PromiseLike<ResultOk<T> | ResultErr<E>> {
  map<U>(fn: (val: T) => U | Promise<U>): ResultAsync<E, U>;
  mapErr<U>(fn: (error: E) => U | Promise<U>): ResultAsync<U, T>;
  andThen<U, F>(fn: (val: T) => Result<F, U> | ResultAsync<F, U> | Promise<Result<F, U>>): ResultAsync<E | F, U>;
  orElse<U, F>(fn: (error: E) => Result<F, U> | ResultAsync<F, U> | Promise<Result<F, U>>): ResultAsync<F, T | U>;
  unwrap(): Promise<T>;
  unwrapErr(): Promise<E>;
  unwrapOr<V>(defaultValue: V): Promise<T | V>;
}
```

```js
import { fromPromise } from '@daisugi/anzen';

const res = await fromPromise(fetch('/api/user'), (e) => e.message)
  .andThen((response) => fromPromise(response.json(), (e) => e.message))
  .map((user) => user.name);

if (res.isOk) {
  console.log(res.unwrap());
}
```

[:top: Back to top](#-table-of-contents)

---

### `okAsync(value)` / `errAsync(error)`

Create an already-settled `ResultAsync`, the async counterparts of `ok` / `err`.

```ts
okAsync<T>(value: T): ResultAsync<never, T>
errAsync<E>(error: E): ResultAsync<E, never>
```

```js
import { okAsync, errAsync } from '@daisugi/anzen';

await okAsync(1).map((x) => x + 1); // Ok(2)
await errAsync('boom').unwrapOr(0); // 0
```

[:top: Back to top](#-table-of-contents)

---

### `fromPromise(promise, parseErr?)`

Lifts a `Promise` that may reject into an `ResultAsync`: a resolved value becomes `Ok`, a rejection becomes `Err`. Without `parseErr` the error type is `unknown` — pass `parseErr` to obtain a typed error (matching neverthrow's `fromPromise(promise, errorFn)` contract).

```ts
fromPromise<T, E = unknown>(promise: Promise<T>, parseErr?: (error: unknown) => E): ResultAsync<E, T>
```

| Parameter  | Type                    | Description                                |
| ---------- | ----------------------- | ------------------------------------------ |
| `promise`  | `Promise<T>`            | A promise that may reject.                 |
| `parseErr` | `(error: unknown) => E` | Optional. Maps a rejection to a typed `E`. |

```js
import { fromPromise } from '@daisugi/anzen';

const res = await fromPromise(Promise.reject(new Error('x')), (e) => e.message);
res.unwrapErr(); // 'x'
```

[:top: Back to top](#-table-of-contents)

---

### `fromSafePromise(promise)`

Lifts a `Promise` that is already known not to reject (it resolves to a `Result`) into an `ResultAsync`.

```ts
fromSafePromise<E, T>(promise: Promise<ResultOk<T> | ResultErr<E>>): ResultAsync<E, T>
```

```js
import { ok, fromSafePromise } from '@daisugi/anzen';

await fromSafePromise(Promise.resolve(ok(1))).map((x) => x + 1); // Ok(2)
```

[:top: Back to top](#-table-of-contents)

---

## 🔷 TypeScript Support

Anzen is fully written in TypeScript and ships its own types. Both `AnzenResultOk<T>` and `AnzenResultErr<E>` are exported for use in function signatures.

```ts
import {
  ok,
  err,
  type AnzenResultOk,
  type AnzenResultErr,
} from '@daisugi/anzen';

function foo(): AnzenResultOk<string> {
  return ok('foo');
}

function bar(): AnzenResultErr<string> {
  return err('err');
}

function baz(): AnzenResultOk<number> | AnzenResultErr<string> {
  if (Math.random() > 0.5) {
    return ok(42);
  }
  return err('err');
}
```

[:top: Back to top](#-table-of-contents)

---

## 🎯 Goal

Anzen aims to provide an abstraction for error handling that simplifies reasoning and ensures predictable outcomes, avoiding unexpected exceptions.

[:top: Back to top](#-table-of-contents)

---

## 🌍 Other Projects

[Meet the ecosystem](../../README.md)

[:top: Back to top](#-table-of-contents)

---

## 📜 License

[MIT](../../LICENSE)

[:top: Back to top](#-table-of-contents)
