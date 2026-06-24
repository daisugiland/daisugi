# @daisugi/anzen

[![version](https://img.shields.io/npm/v/@daisugi/anzen.svg)](https://www.npmjs.com/package/@daisugi/anzen)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/anzen)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/anzen)](https://bundlephobia.com/result?p=@daisugi/anzen)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Anzen** is a `Result` type for handling errors without throwing exceptions. Inspired by Rust and Haskell.

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

A `Result` is either an `Ok` (success) or an `Err` (failure). You check which one you have, then read the value.

```js
import { fromThrowable } from '@daisugi/anzen';
import { readFileSync } from 'node:fs';

// Wrap a throwing function once. It now returns a Result instead of throwing.
const readFile = fromThrowable(
  (path) => readFileSync(path, 'utf8'),
  (error) => error.message,
);

const result = readFile('test.txt');

if (result.isErr) {
  console.error(result.unwrapErr()); // the error message
} else {
  console.log(result.unwrap()); // the file contents
}
```

---

## 📖 Table of Contents

- [@daisugi/anzen](#daisugianzen)
  - [✨ Features](#-features)
  - [🚀 Usage](#-usage)
  - [📖 Table of Contents](#-table-of-contents)
  - [📦 Installation](#-installation)
  - [🔍 Overview](#-overview)
  - [🎯 Motivation](#-motivation)
    - [✅ Key Requirements](#-key-requirements)
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
    - [`promiseAllTuple([defaults, ...results])`](#promisealltupledefaults-results)
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

Anzen makes errors part of the return value instead of something you `throw`. Every function says, in its type, that it can fail.

You handle both paths explicitly, and you can chain transforms without `try/catch`. What you get:

- ✅ `ok` and `err` to wrap a value or an error.
- ✅ `.map` / `.andThen` to transform the success path.
- ✅ `.mapErr` / `.orElse` to transform or recover the error path.
- ✅ Async helpers: `promiseAll`, `fromAsyncThrowable`, and `safeTry`.
- ✅ JSON serialization with `toJSON` / `fromJSON`.
- ✅ Full TypeScript type inference on every operation.
- ✅ Works with [@daisugi/ayamari](../ayamari) for structured errors.

[:top: Back to top](#-table-of-contents)

---

## 🎯 Motivation

Anzen brings typed error handling to JavaScript without the ceremony of `try/catch`.

If it fits your needs, great. If not, look at [True-Myth](https://true-myth.js.org/) or [neverthrow](https://github.com/supermacro/neverthrow).

### ✅ Key Requirements

- Compose steps in sequence with guards, not long method chains.
- `unwrap()` / `unwrapErr()` throw on purpose, so bugs surface instead of failing silently.
- No async API (AsyncResult) by design. You write sequential code with plain `async`/`await`.
- A simple but powerful API.

[:top: Back to top](#-table-of-contents)

---

## 📚 API

Every function and method below is importable from `@daisugi/anzen`.

### `ok(value)`

Creates a successful Result that wraps `value`.

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

Creates a failed Result that wraps `error`.

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

Type guard that tells you whether a value is a Result. Returns `true` for any `Ok` or `Err`.

```ts
isAnzenResult(value: unknown): value is AnzenResult<unknown, unknown>
```

| Parameter | Type      | Description        |
| --------- | --------- | ------------------ |
| `value`   | `unknown` | The value to test. |

```js
import { ok, isAnzenResult } from '@daisugi/anzen';

isAnzenResult(ok('foo')); // true
isAnzenResult({ isOk: true }); // false
```

---

### `result.isOk / result.isErr`

Boolean flags telling you which variant you have. Exactly one is `true`.

```js
import { ok, err } from '@daisugi/anzen';

ok('foo').isOk; // true
ok('foo').isErr; // false

err('err').isOk; // false
err('err').isErr; // true
```

---

### `result.unwrap()`

Returns the Ok value. Throws if the Result is an Err.

Guard with `result.isOk` first, or use `unwrapOr` for a safe default.

```ts
result.unwrap(): T
```

```js
import { ok } from '@daisugi/anzen';

ok('foo').unwrap(); // 'foo'
```

---

### `result.unwrapErr()`

Returns the error value. Throws if the Result is an Ok.

Guard with `result.isErr` first.

```ts
result.unwrapErr(): E
```

```js
import { err } from '@daisugi/anzen';

err('err').unwrapErr(); // 'err'
```

---

### `result.unwrapOr(defaultValue)`

Returns the Ok value, or `defaultValue` when the Result is an Err. Never throws.

```ts
result.unwrapOr<V>(defaultValue: V): T | V
```

| Parameter      | Type | Description                     |
| -------------- | ---- | ------------------------------- |
| `defaultValue` | `V`  | Fallback value returned on Err. |

```js
import { err } from '@daisugi/anzen';

err('err').unwrapOr('foo'); // 'foo'
```

---

### `result.map(fn)`

Transforms the Ok value with `fn` and returns a new Ok. On Err, returns the Result unchanged.

```ts
result.map<V>(fn: (value: T) => V): ResultOk<V> | ResultErr<E>
```

| Parameter | Type              | Description                        |
| --------- | ----------------- | ---------------------------------- |
| `fn`      | `(value: T) => V` | Transform applied to the Ok value. |

```js
import { ok } from '@daisugi/anzen';

ok('foo')
  .map((value) => value)
  .unwrap(); // 'foo'
```

---

### `result.andThen(fn)`

Like `map`, but `fn` returns a new Result. Use it to chain steps that can each fail. On Err, returns the Result unchanged.

```ts
result.andThen<V, F>(fn: (value: T) => AnzenResult<F, V>): AnzenResult<E | F, V>
```

| Parameter | Type                   | Description                             |
| --------- | ---------------------- | --------------------------------------- |
| `fn`      | `(value: T) => Result` | Returns a new Result from the Ok value. |

```js
import { ok } from '@daisugi/anzen';

ok('foo')
  .andThen((value) => ok(value))
  .unwrap(); // 'foo'
```

---

### `result.orElse(fn)`

Recovers from an Err by passing the error to `fn`, which returns a new Result. On Ok, returns the Result unchanged.

```ts
result.orElse<V, F>(fn: (err: E) => AnzenResult<F, V>): AnzenResult<F, T | V>
```

| Parameter | Type                 | Description                                     |
| --------- | -------------------- | ----------------------------------------------- |
| `fn`      | `(err: E) => Result` | Returns a recovery Result from the error value. |

```js
import { ok, err } from '@daisugi/anzen';

err('err')
  .orElse((err) => ok('foo'))
  .unwrap(); // 'foo'
```

---

### `result.mapErr(fn)`

Transforms the error with `fn` and returns the result as a new Ok. On Ok, returns the Result unchanged.

```ts
result.mapErr<V>(fn: (err: E) => V): ResultOk<T | V>
```

| Parameter | Type            | Description                           |
| --------- | --------------- | ------------------------------------- |
| `fn`      | `(err: E) => V` | Transform applied to the error value. |

```js
import { err } from '@daisugi/anzen';

err('err')
  .mapErr((err) => 'foo')
  .unwrap(); // 'foo'
```

---

### `result.toTuple(defaultValue?)`

Returns a `[result, value]` tuple. On Ok, the value is the wrapped value.

On Err, the value is `defaultValue` (or `undefined` if you omit it).

```ts
// On Ok - no argument needed:
result.toTuple(): [ResultOk<T>, T]

// On Err - optional default:
result.toTuple<V>(defaultValue?: V): [ResultErr<E>, V]
```

| Parameter      | Type | Description                                     |
| -------------- | ---- | ----------------------------------------------- |
| `defaultValue` | `V`  | Second tuple element when the Result is an Err. |

```js
import { ok, err } from '@daisugi/anzen';

const [res, value] = ok('foo').toTuple();
// value is 'foo'

const [errRes, output] = err('err').toTuple('foo');
// output is 'foo'
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

Turns a JSON string from `toJSON` back into a Result.

```ts
fromJSON<E = unknown, T = unknown>(json: string): AnzenResult<E, T>
```

| Parameter | Type     | Description                         |
| --------- | -------- | ----------------------------------- |
| `json`    | `string` | A JSON string produced by `toJSON`. |

```js
import { fromJSON } from '@daisugi/anzen';

fromJSON('{"value":"foo","isOk":true}').unwrap(); // 'foo'
```

---

### `promiseAll(results)`

Runs Results (and Promises of Results) in parallel. Returns one Result.

If all succeed, you get an Ok with an array of values. If any fail, you get the first Err.

```ts
promiseAll<T extends (AnzenResult<unknown, unknown> | Promise<AnzenResult<unknown, unknown>>)[]>(
  whenRes: T,
): Promise<AnzenResultOk<ExtractOk<T>> | AnzenResultErr<unknown>>
```

| Parameter | Type                            | Description                             |
| --------- | ------------------------------- | --------------------------------------- |
| `whenRes` | `(Result \| Promise<Result>)[]` | Results or Promises to run in parallel. |

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

const result = await promiseAll([err('err')]);

result.unwrapErr(); // 'err'
```

---

### `promiseAllTuple([defaults, ...results])`

Like `promiseAll`, but returns a tuple. The first element is the overall Result.

The rest are the unwrapped values, or your defaults if any Result fails. Pass one default per Result.

```ts
promiseAllTuple<T extends (AnzenResult<unknown, unknown> | Promise<AnzenResult<unknown, unknown>>)[]>(
  args: [ExtractOk<T>, ...T],
): Promise<[AnzenResultOk<ExtractOk<T>> | AnzenResultErr<unknown>, ...ExtractOk<T>]>
```

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

Returns a function that turns a Result into a `[result, value]` tuple. Handy as a `.then()` callback.

The value is the Ok value, or `defaultValue` on Err.

```ts
toTuple<V>(defaultValue?: V): (result: AnzenResult<unknown, unknown>) => [AnzenResult<unknown, unknown>, unknown | V]
```

| Parameter      | Type | Description                  |
| -------------- | ---- | ---------------------------- |
| `defaultValue` | `V`  | Second tuple element on Err. |

```js
import { err, toTuple } from '@daisugi/anzen';

const fn = async () => err('err');
const [res, output] = await fn().then(toTuple('foo'));
// output is 'foo'
```

---

### `fromAsyncThrowable(fn, parseErr?)`

Wraps an async function that may throw or reject, returning a function that gives back a Result instead.

Pass `parseErr` to shape the caught error. Wrap once, reuse everywhere.

```ts
fromAsyncThrowable<E = unknown, T = unknown, A extends readonly unknown[] = []>(
  fn: (...args: A) => Promise<T>,
  parseErr?: (err: unknown) => E,
): (...args: A) => Promise<AnzenResult<E, T>>
```

| Parameter  | Type                         | Description                            |
| ---------- | ---------------------------- | -------------------------------------- |
| `fn`       | `(...args: A) => Promise<T>` | Async function to wrap.                |
| `parseErr` | `(err: unknown) => E`        | Optional transform for a caught error. |

```js
import { fromAsyncThrowable } from '@daisugi/anzen';

const fetchUser = fromAsyncThrowable(
  async (id) => db.findUser(id),
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

| Parameter  | Type                  | Description                            |
| ---------- | --------------------- | -------------------------------------- |
| `fn`       | `(...args: A) => T`   | Synchronous function to wrap.          |
| `parseErr` | `(err: unknown) => E` | Optional transform for a caught error. |

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

Runs a generator where `yield*` on a Result unwraps an Ok or short-circuits on an Err. This is Rust's `?`-style propagation.

A `function*` returns a Result. An `async function*` (using `yield* await ...`) returns a Promise of one.

```ts
function safeTry<E, T>(
  body: () => Generator<AnzenResultErr<E>, AnzenResult<E, T>>,
): AnzenResult<E, T>;
function safeTry<E, T>(
  body: () => AsyncGenerator<AnzenResultErr<E>, AnzenResult<E, T>>,
): Promise<AnzenResult<E, T>>;
```

| Parameter | Type                                | Description                                                    |
| --------- | ----------------------------------- | -------------------------------------------------------------- |
| `body`    | `() => Generator \| AsyncGenerator` | Generator that `yield*`s Results and returns the final Result. |

**Sync example** - returns a Result directly:

```js
import { safeTry, ok, err } from '@daisugi/anzen';

const divide = (a, b) =>
  safeTry(function* () {
    const validated = yield* validatePositive(b); // short-circuits on Err
    return ok(a / validated);
  });

const res = divide(10, 0);
if (res.isErr) console.warn(res.unwrapErr());
else console.log(res.unwrap());
```

**Async example** - returns a `Promise<Result>`:

```js
const checkout = (userId, amount) =>
  safeTry(async function* () {
    const user = yield* await userRepo.find(userId);
    if (!user) return err({ kind: 'userNotFound', userId });

    const receipt = yield* await payments.charge(user.cardToken, amount);

    // Return the final Result directly. Do not `yield*` it.
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

[:top: Back to top](#-table-of-contents)

---

## 🧩 Composition Styles Side by Side

There are two ways to chain steps that can fail. Both produce the same Result, so the call site is identical.

This shared setup wraps each throwing call once:

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
```

The call site is the same for both styles:

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

| Style               | Best when                                                   |
| ------------------- | ----------------------------------------------------------- |
| Sequential `Result` | Branches, loops, or several values in scope. Most explicit. |
| `safeTry`           | Multi-step flows where you want guard-free propagation.     |

[:top: Back to top](#-table-of-contents)

---

## 🔷 TypeScript Support

Anzen is written in TypeScript and ships its own types. Use `AnzenResultOk<T>` and `AnzenResultErr<E>` in your signatures.

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

Anzen gives you one simple way to handle errors. Outcomes are predictable, and exceptions never catch you by surprise.

[:top: Back to top](#-table-of-contents)

---

## 🌍 Other Projects

[Meet the ecosystem](../../README.md)

[:top: Back to top](#-table-of-contents)

---

## 📜 License

[MIT](../../LICENSE)

[:top: Back to top](#-table-of-contents)
