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
- 🌐 Universal — runs in the browser and on the server (Node.js)
- 🔀 Supports both ES Modules and CommonJS

---

## 🚀 Usage

```js
import { success, failure } from '@daisugi/anzen';
import { readFileSync } from 'node:fs';

function readFile(path) {
  try {
    const response = readFileSync(path);
    return success(response);
  } catch (err) {
    return failure(err);
  }
}

const result = readFile('test.txt');

if (result.isFailure) {
  return result.getError();
}

return result.getValue();
```

Every combinator is a standalone named export, so unused helpers are tree-shaken away — `import { success }` pulls in nothing else.

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
    - [`success(value)`](#successvalue)
    - [`failure(err)`](#failureerr)
    - [`result.isSuccess / result.isFailure`](#resultissuccess--resultisfailure)
    - [`result.getValue()`](#resultgetvalue)
    - [`result.getError()`](#resultgeterror)
    - [`result.getOrElse(defaultValue)`](#resultgetorelsedefaultvalue)
    - [`result.map(fn)`](#resultmapfn)
    - [`result.chain(fn)`](#resultchainfn)
    - [`result.elseChain(fn)`](#resultelsechainfn)
    - [`result.elseMap(fn)`](#resultelsemapfn)
    - [`result.unwrap(defaultValue?)`](#resultunwrapdefaultvalue)
    - [`result.unsafeUnwrap()`](#resultunsafeunwrap)
    - [`result.toJSON()`](#resulttojson)
    - [`fromJSON(json)`](#fromjsonjson)
    - [`promiseAll(results)`](#promiseallresults)
    - [`unwrapPromiseAll([defaults, ...results])`](#unwrappromisealldefaults-results)
    - [`unwrap(defaultValue?)`](#unwrapdefaultvalue)
    - [`fromThrowable(fn, parseErr?)`](#fromthrowablefn-parseerr)
    - [`fromSyncThrowable(fn, parseErr?)`](#fromsyncthrowablefn-parseerr)
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

- ✅ `success` and `failure` constructors for wrapping values and errors
- ✅ Chainable `.map` / `.chain` transforms for success paths
- ✅ Mirror `.elseMap` / `.elseChain` transforms for failure paths
- ✅ Async helpers: `promiseAll` and `fromThrowable`
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

A `Result` instance is either a `ResultSuccess<T>` or a `ResultFailure<E>`. The standalone `success` / `failure` / `fromJSON` / `promiseAll` / `unwrapPromiseAll` / `unwrap` / `fromThrowable` / `fromSyncThrowable` exports create or combine instances; instance methods transform or extract values.

### `success(value)`

Creates a successful Result wrapping the given value.

```ts
success<T>(value: T): ResultSuccess<T>
```

| Parameter | Type | Description                |
| --------- | ---- | -------------------------- |
| `value`   | `T`  | The success value to wrap. |

```js
import { success } from '@daisugi/anzen';

const res = success('foo');
```

---

### `failure(err)`

Creates a failure Result wrapping the given error.

```ts
failure<E>(err: E): ResultFailure<E>
```

| Parameter | Type | Description              |
| --------- | ---- | ------------------------ |
| `err`     | `E`  | The error value to wrap. |

```js
import { failure } from '@daisugi/anzen';

const res = failure('err');
```

---

### `result.isSuccess / result.isFailure`

Boolean properties that indicate whether the Result represents a success or a failure. Exactly one is `true` at any time.

```js
import { success, failure } from '@daisugi/anzen';

const res = success('foo');
console.log(res.isSuccess); // true
console.log(res.isFailure); // false

const errRes = failure('err');
console.log(errRes.isSuccess); // false
console.log(errRes.isFailure); // true
```

---

### `result.getValue()`

Returns the success value. Throws if the Result is a failure — guard with `result.isSuccess` or use `getOrElse` for a safe alternative.

```ts
result.getValue(): T
```

```js
import { success } from '@daisugi/anzen';

const value = success('foo').getValue();
// 'foo'
```

---

### `result.getError()`

Returns the error value. Throws if the Result is a success — guard with `result.isFailure`.

```ts
result.getError(): E
```

```js
import { failure } from '@daisugi/anzen';

const error = failure('err').getError();
// 'err'
```

---

### `result.getOrElse(defaultValue)`

Returns the success value, or `defaultValue` if the Result is a failure. Never throws.

```ts
result.getOrElse<V>(defaultValue: V): T | V
```

| Parameter      | Type | Description                         |
| -------------- | ---- | ----------------------------------- |
| `defaultValue` | `V`  | Fallback value returned on failure. |

```js
import { failure } from '@daisugi/anzen';

const value = failure('err').getOrElse('foo');
// 'foo'
```

---

### `result.map(fn)`

Applies `fn` to the success value and wraps the return in a new success Result. Passes through unchanged on failure.

```ts
result.map<V>(fn: (value: T) => V): ResultSuccess<V> | ResultFailure<E>
```

| Parameter | Type              | Description                             |
| --------- | ----------------- | --------------------------------------- |
| `fn`      | `(value: T) => V` | Transform applied to the success value. |

```js
import { success } from '@daisugi/anzen';

const result = success('foo')
  .map((value) => value)
  .getValue();
// 'foo'
```

---

### `result.chain(fn)`

Applies `fn` to the success value, where `fn` returns a new `Result`. Passes through unchanged on failure. Useful for sequencing operations that may themselves fail.

```ts
result.chain<V, F>(fn: (value: T) => AnzenAnyResult<F, V>): AnzenAnyResult<E | F, V>
```

| Parameter | Type                   | Description                                                 |
| --------- | ---------------------- | ----------------------------------------------------------- |
| `fn`      | `(value: T) => Result` | Function that produces a new Result from the success value. |

```js
import { success } from '@daisugi/anzen';

const result = success('foo')
  .chain((value) => success(value))
  .getValue();
// 'foo'
```

---

### `result.elseChain(fn)`

For a failure Result, applies `fn` to the error value, where `fn` returns a new Result. Passes through unchanged on success. Useful for recovering from errors.

```ts
result.elseChain<V, F>(fn: (err: E) => AnzenAnyResult<F, V>): AnzenAnyResult<F, T | V>
```

| Parameter | Type                 | Description                                                    |
| --------- | -------------------- | -------------------------------------------------------------- |
| `fn`      | `(err: E) => Result` | Function that produces a recovery Result from the error value. |

```js
import { success, failure } from '@daisugi/anzen';

const result = failure('err')
  .elseChain((err) => success('foo'))
  .getValue();
// 'foo'
```

---

### `result.elseMap(fn)`

For a failure Result, transforms the error value using `fn` and wraps the return in a new success Result. Passes through unchanged on success.

```ts
result.elseMap<V>(fn: (err: E) => V): ResultSuccess<T | V>
```

| Parameter | Type            | Description                           |
| --------- | --------------- | ------------------------------------- |
| `fn`      | `(err: E) => V` | Transform applied to the error value. |

```js
import { failure } from '@daisugi/anzen';

const result = failure('err')
  .elseMap((err) => 'foo')
  .getValue();
// 'foo'
```

---

### `result.unwrap(defaultValue?)`

Returns a tuple `[result, value]`. On success, the second element is the wrapped value. On failure, the second element is `defaultValue` (or `undefined` if omitted).

```ts
// On ResultSuccess — no argument needed:
result.unwrap(): [ResultSuccess<T>, T]

// On ResultFailure — optional default:
result.unwrap<V>(defaultValue?: V): [ResultFailure<E>, V]
```

| Parameter      | Type | Description                                                          |
| -------------- | ---- | -------------------------------------------------------------------- |
| `defaultValue` | `V`  | Value used as the second tuple element when the Result is a failure. |

```js
import { success, failure } from '@daisugi/anzen';

const [res, value] = success('foo').unwrap();
// res is the ResultSuccess instance, value is 'foo'

const [errRes, output] = failure('err').unwrap('foo');
// errRes is the ResultFailure instance, output is 'foo'
```

---

### `result.unsafeUnwrap()`

Returns the inner value or error without any safety checks. Prefer `getValue` / `getError` with an `isSuccess` / `isFailure` guard.

```ts
result.unsafeUnwrap(): T | E
```

```js
import { failure } from '@daisugi/anzen';

const output = failure('err').unsafeUnwrap();
// 'err'
```

---

### `result.toJSON()`

Serializes the Result to a JSON string.

```ts
result.toJSON(): string
```

```js
import { success, failure } from '@daisugi/anzen';

success('foo').toJSON();
// '{"value":"foo","isSuccess":true}'

failure('err').toJSON();
// '{"error":"err","isSuccess":false}'
```

---

### `fromJSON(json)`

Deserializes a JSON string (as produced by `toJSON`) into a Result instance.

```ts
fromJSON<E = unknown, T = unknown>(json: string): AnzenAnyResult<E, T>
```

| Parameter | Type     | Description                                    |
| --------- | -------- | ---------------------------------------------- |
| `json`    | `string` | A JSON string previously produced by `toJSON`. |

```js
import { fromJSON } from '@daisugi/anzen';

const value = fromJSON('{"value":"foo","isSuccess":true}').getValue();
// 'foo'
```

---

### `promiseAll(results)`

Runs an array of Results or Promises of Results in parallel. Returns a success Result containing an array of all values if every entry succeeds, or the first failure encountered.

```ts
promiseAll<T extends (AnzenAnyResult<unknown, unknown> | Promise<AnzenAnyResult<unknown, unknown>>)[]>(
  whenRes: T,
): Promise<AnzenResultSuccess<ExtractSuccess<T>> | AnzenResultFailure<ExtractFailure<T>>>
```

| Parameter | Type                            | Description                                        |
| --------- | ------------------------------- | -------------------------------------------------- |
| `whenRes` | `(Result \| Promise<Result>)[]` | Results or Promises of Results to run in parallel. |

```js
import { success, promiseAll } from '@daisugi/anzen';

const result = await promiseAll([
  success('foo'),
  Promise.resolve(success('bar')),
]);

result.getValue(); // ['foo', 'bar']
```

On failure:

```js
import { failure, promiseAll } from '@daisugi/anzen';

const result = await promiseAll([
  failure('err'),
]);

result.getError(); // 'err'
```

---

### `unwrapPromiseAll([defaults, ...results])`

Runs an array of Results or Promises of Results in parallel and unwraps them. The first element of the returned tuple is a Result representing the overall outcome; the remaining elements are the individual unwrapped values (or defaults on failure).

```ts
unwrapPromiseAll<T extends (AnzenAnyResult<unknown, unknown> | Promise<AnzenAnyResult<unknown, unknown>>)[]>(
  args: [Partial<ExtractSuccess<T>>, ...T],
): Promise<[AnzenResultSuccess<ExtractSuccess<T>> | AnzenResultFailure<ExtractFailure<T>>, ...ExtractSuccess<T>]>
```

| Parameter    | Type                         | Description                                                                                                                                                            |
| ------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `args[0]`    | `Partial<ExtractSuccess<T>>` | Default values returned as the remaining tuple elements on failure. Each default is type-checked against the corresponding success value type; pass `[]` to omit them. |
| `args[1..n]` | `Result \| Promise<Result>`  | Results or Promises of Results to run in parallel.                                                                                                                     |

```js
import { success, unwrapPromiseAll } from '@daisugi/anzen';

const [res, val1, val2] = await unwrapPromiseAll([
  [], // defaults
  success('foo'),
  Promise.resolve(success('bar')),
]);

res.isSuccess; // true
val1; // 'foo'
val2; // 'bar'
```

---

### `unwrap(defaultValue?)`

Returns a function that unpacks a Result into a tuple `[result, value]`, for use as a `.then()` callback. The second element is the success value, or `defaultValue` on failure.

```ts
unwrap<V>(defaultValue?: V): (result: AnzenAnyResult<unknown, unknown>) => [AnzenAnyResult<unknown, unknown>, unknown | V]
```

| Parameter      | Type | Description                                        |
| -------------- | ---- | -------------------------------------------------- |
| `defaultValue` | `V`  | Value used as the second tuple element on failure. |

```js
import { failure, unwrap } from '@daisugi/anzen';

const fn = async () => failure('err');
const [res, output] = await fn().then(unwrap('foo'));
// res is the failure instance, output is 'foo'
```

---

### `fromThrowable(fn, parseErr?)`

Executes an async function that may throw. Returns a success Result with the resolved value, or a failure Result with the error passed through `parseErr`.

```ts
fromThrowable<E = unknown, T = unknown>(
  fn: () => Promise<T>,
  parseErr?: (err: unknown) => E,
): Promise<AnzenAnyResult<E, T>>
```

| Parameter  | Type                  | Description                                   |
| ---------- | --------------------- | --------------------------------------------- |
| `fn`       | `() => Promise<T>`    | Async function to execute.                    |
| `parseErr` | `(err: unknown) => E` | Optional transform applied to a caught error. |

```js
import { fromThrowable } from '@daisugi/anzen';

const result = await fromThrowable(
  async () => { throw new Error('err') },
  (err) => err.message,
);

result.getError(); // 'err'
```

---

### `fromSyncThrowable(fn, parseErr?)`

Same as `fromThrowable`, but for synchronous functions.

```ts
fromSyncThrowable<E = unknown, T = unknown>(
  fn: () => T,
  parseErr?: (err: unknown) => E,
): AnzenAnyResult<E, T>
```

| Parameter  | Type                  | Description                                   |
| ---------- | --------------------- | --------------------------------------------- |
| `fn`       | `() => T`             | Synchronous function to execute.              |
| `parseErr` | `(err: unknown) => E` | Optional transform applied to a caught error. |

```js
import { fromSyncThrowable } from '@daisugi/anzen';

const result = fromSyncThrowable(
  () => { throw new Error('err') },
  (err) => err.message,
);

result.getError(); // 'err'
```

[:top: Back to top](#-table-of-contents)

---

## 🔷 TypeScript Support

Anzen is fully written in TypeScript and ships its own types. Both `AnzenResultSuccess<T>` and `AnzenResultFailure<E>` are exported for use in function signatures.

```ts
import {
  success,
  failure,
  type AnzenResultSuccess,
  type AnzenResultFailure,
} from '@daisugi/anzen';

function foo(): AnzenResultSuccess<string> {
  return success('foo');
}

function bar(): AnzenResultFailure<string> {
  return failure('err');
}

function baz(): AnzenResultSuccess<number> | AnzenResultFailure<string> {
  if (Math.random() > 0.5) {
    return success(42);
  }
  return failure('err');
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
