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
    - [`promiseAllTuple([defaults, ...results])`](#promisealltuple-defaults-results)
    - [`toTuple(defaultValue?)`](#totupledefaultvalue)
    - [`fromAsyncThrowable(fn, parseErr?)`](#fromasyncthrowablefn-parseerr)
    - [`fromThrowable(fn, parseErr?)`](#fromthrowablefn-parseerr)
    - [`safeTry(body)`](#safetrybody)
  - [🧩 Composition Styles Side by Side](#-composition-styles-side-by-side)
    - [1. Sequential `Result`](#1-sequential-result)
    - [2. `safeTry` (generator, Rust `?`-style)](#2-safetry-generator-rust--style)
    - [Which to reach for](#which-to-reach-for)
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
- ✅ Async helpers: `promiseAll`, `fromAsyncThrowable`, and `safeTry` for generator-based `?`-style propagation
- ✅ JSON serialization and deserialization
- ✅ TypeScript-first with full type inference on all operations
- ✅ Integration with [@daisugi/ayamari](../ayamari) for rich, structured error objects

[:top: Back to top](#-table-of-contents)

---

## 🎯 Motivation

Anzen was created to bring explicit, typed error handling to JavaScript without the ceremony of try/catch blocks. If these requirements align with yours, Anzen may be a good fit. Otherwise, alternatives like [True-Myth](https://true-myth.js.org/) or [neverthrow](https://github.com/supermacro/neverthrow) might be worth exploring.

### ✅ Key Requirements

- Errors and values are both typed — no `unknown` catch clauses or silent swallowing.
- Sequential `await` + `isOk` / `isErr` guards over chainable async pipelines: multi-step flows need earlier bindings in later steps, and a method chain is no less verbose while adding runtime overhead.
- `unwrap()` / `unwrapErr()` throw on the wrong variant by design — use them after a guard or to assert a programmer bug, so failures surface at the call site rather than propagating silently.
- Minimal API with no global state, no decorators, and no runtime dependencies.

[:top: Back to top](#-table-of-contents)

---

## 📚 API

A `Result` instance is either a `ResultOk<T>` or a `ResultErr<E>`. The standalone `ok` / `err` / `fromJSON` / `promiseAll` / `promiseAllTuple` / `toTuple` / `fromThrowable` / `fromAsyncThrowable` exports create or combine instances; instance methods transform or extract values.

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

Runs an array of Results or Promises of Results in parallel. Waits for every input to settle, then returns an Ok Result containing an array of all values if every entry succeeds, or the first Err in array order. The failure branch is typed `unknown` because a wrapped Promise may reject with anything; use `fromAsyncThrowable`/`fromPromise` with a `parseErr` upstream if you need a typed error.

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

### `promiseAllTuple([defaults, ...results])`

Runs an array of Results or Promises of Results in parallel and unwraps them. The first element of the returned tuple is a Result representing the overall outcome; the remaining elements are the individual unwrapped values (or the defaults on Err).

```ts
promiseAllTuple<T extends (AnzenResult<unknown, unknown> | Promise<AnzenResult<unknown, unknown>>)[]>(
  args: [ExtractOk<T>, ...T],
): Promise<[AnzenResultOk<ExtractOk<T>> | AnzenResultErr<unknown>, ...ExtractOk<T>]>
```

| Parameter    | Type                        | Description                                                                                                                                                                                                                                                                                                                                       |
| ------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `args[0]`    | `ExtractOk<T>`              | A **full-length** tuple of default values, returned as the remaining tuple elements on Err. Each default is type-checked against the corresponding Ok value type. A partial/short tuple is a type error: on Err it is spread into the value positions, so a missing default would leave an `undefined` the return type claims is a present value. |
| `args[1..n]` | `Result \| Promise<Result>` | Results or Promises of Results to run in parallel.                                                                                                                                                                                                                                                                                                |

```js
import { ok, promiseAllTuple } from '@daisugi/anzen';

const [res, val1, val2] = await promiseAllTuple([
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

Adapts an async function that may throw or reject into a reusable Result-returning function, preserving its parameters. A synchronous throw at the call site is caught too. Adapt a throwing function once, at the boundary, and reuse it throughout.

```ts
fromAsyncThrowable<E = unknown, T = unknown, A extends readonly unknown[] = []>(
  fn: (...args: A) => Promise<T>,
  parseErr?: (err: unknown) => E,
): (...args: A) => Promise<AnzenResult<E, T>>
```

| Parameter  | Type                         | Description                                   |
| ---------- | ---------------------------- | --------------------------------------------- |
| `fn`       | `(...args: A) => Promise<T>` | Async function to adapt.                      |
| `parseErr` | `(err: unknown) => E`        | Optional transform applied to a caught error. |

```js
import { fromAsyncThrowable } from '@daisugi/anzen';

const fetchUser = fromAsyncThrowable(
  async (id) => { /* may throw */ return await db.findUser(id); },
  (err) => err.message,
);

const res = await fetchUser(42);
if (res.isOk) console.log(res.unwrap());
```

[:top: Back to top](#-table-of-contents)

---

### `fromThrowable(fn, parseErr?)`

Same as `fromAsyncThrowable`, but for synchronous functions.

```ts
fromThrowable<E = unknown, T = unknown, A extends readonly unknown[] = []>(
  fn: (...args: A) => T,
  parseErr?: (err: unknown) => E,
): (...args: A) => AnzenResult<E, T>
```

| Parameter  | Type                  | Description                                   |
| ---------- | --------------------- | --------------------------------------------- |
| `fn`       | `(...args: A) => T`   | Synchronous function to adapt.                |
| `parseErr` | `(err: unknown) => E` | Optional transform applied to a caught error. |

```js
import { fromThrowable } from '@daisugi/anzen';

const parseJSON = fromThrowable(
  (raw) => JSON.parse(raw),
  (err) => err.message,
);

const res = parseJSON('{"ok":true}');
if (res.isOk) console.log(res.unwrap());
```

[:top: Back to top](#-table-of-contents)

---

### `safeTry(body)`

Rust's `?`-operator for Results, built on generators. Inside the generator body, `yield* result` unwraps an `Ok` to its value or aborts the whole body, making `safeTry` return that `Err`. This keeps a chain of dependent, fallible steps in plain control flow — local `const`s, `if` branches, loops — without an `isErr` guard after every call.

A synchronous generator (`function*`) returns a `Result`; an async one (`async function*`, using `yield* await ...`) returns a `Promise` of one. The error type is inferred as the union of every yielded Result's error.

```ts
function safeTry<E, T>(
  body: () => Generator<AnzenResultErr<E>, AnzenResult<E, T>>,
): AnzenResult<E, T>;
function safeTry<E, T>(
  body: () => AsyncGenerator<AnzenResultErr<E>, AnzenResult<E, T>>,
): Promise<AnzenResult<E, T>>;
```

| Parameter | Type                                | Description                                                      |
| --------- | ----------------------------------- | ---------------------------------------------------------------- |
| `body`    | `() => Generator \| AsyncGenerator` | Generator that `yield*`s Results and returns the final `Result`. |

```js
import { safeTry, ok, err } from '@daisugi/anzen';

const checkout = (userId, amount) =>
  safeTry(async function* () {
    const user = yield* await userRepo.find(userId);
    if (!user) return err({ kind: 'userNotFound', userId });

    const receipt = yield* await payments.charge(user.cardToken, amount);

    // Return the final Result directly — do not `yield*` it, or you would
    // return the unwrapped value instead of a Result.
    return await userRepo.saveOrder({
      userId: user.id,
      amount,
      receiptId: receipt.id,
    });
  });

const res = await checkout('u_123', 4999);
if (res.isErr) console.warn(res.unwrapErr());
else handleOrder(res.unwrap());
```

The first `Err` short-circuits: every step after it is skipped and that error flows straight out. `safeTry` is the idiomatic choice when the flow needs branching, loops, or several intermediate values in scope at once; sequential `await` + `isErr` guards are preferred for simpler linear flows.

[:top: Back to top](#-table-of-contents)

---

## 🧩 Composition Styles Side by Side

The same flow — look up a user, charge their card, persist the order — written two ways. Each step is async and fallible. Both share **one boundary layer**: every throwing dependency is adapted to a Result exactly once with `fromAsyncThrowable`, so neither call site repeats that wrapping.

```ts
import {
  ok,
  err,
  safeTry,
  fromAsyncThrowable,
  type AnzenResult,
} from '@daisugi/anzen';

type CheckoutErr =
  | { kind: 'userNotFound'; userId: string }
  | { kind: 'cardDeclined'; reason: string }
  | { kind: 'dbWriteFailed'; cause: unknown };

// Adapt each throwing call once, at the boundary.
const userRepo = {
  find: fromAsyncThrowable(
    db.findUser,
    (cause): CheckoutErr => ({ kind: 'dbWriteFailed', cause }),
  ),
  saveOrder: fromAsyncThrowable(
    db.saveOrder,
    (cause): CheckoutErr => ({ kind: 'dbWriteFailed', cause }),
  ),
};
const payments = {
  charge: fromAsyncThrowable(
    rawPayments.charge,
    (e): CheckoutErr => ({ kind: 'cardDeclined', reason: String(e) }),
  ),
};
// userRepo.find:      (userId)     => Promise<AnzenResult<CheckoutErr, User | null>>
// payments.charge:    (token, amt) => Promise<AnzenResult<CheckoutErr, Receipt>>
// userRepo.saveOrder: (order)      => Promise<AnzenResult<CheckoutErr, Order>>
```

The call site is identical for all three:

```ts
const res = await checkout('u_123', 4999);
if (res.isErr) log.warn('checkout failed', res.unwrapErr());
else fulfil(res.unwrap());
```

### 1. Sequential `Result`

```ts
async function checkout(
  userId: string,
  amount: number,
): Promise<AnzenResult<CheckoutErr, Order>> {
  const userRes = await userRepo.find(userId);
  if (userRes.isErr) return userRes;
  const user = userRes.unwrap();
  if (!user) return err({ kind: 'userNotFound', userId });

  const chargeRes = await payments.charge(user.cardToken, amount);
  if (chargeRes.isErr) return chargeRes;

  return userRepo.saveOrder({
    userId: user.id,
    amount,
    receiptId: chargeRes.unwrap().id,
  });
}
```

### 2. `safeTry` (generator, Rust `?`-style)


```ts
function checkout(userId: string, amount: number) {
  return safeTry(async function* () {
    const user = yield* await userRepo.find(userId);
    if (!user) return err<CheckoutErr>({ kind: 'userNotFound', userId });

    const receipt = yield* await payments.charge(user.cardToken, amount);

    return await userRepo.saveOrder({
      userId: user.id,
      amount,
      receiptId: receipt.id,
    });
  });
}
```

### Which to reach for

| Style               | Best when                                              | Notes                                                                                                                                                     |
| ------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sequential `Result` | Branches, loops, several intermediate values in scope  | Leanest at runtime; most explicit (`isErr` per step)                                                                                                      |
| `safeTry`           | Multi-step flows where you want guard-free propagation | Generator overhead is negligible for I/O-bound work; see the [`safeTry`](#safetrybody) caveats (no throw-catching, no `finally` cleanup on short-circuit) |

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
