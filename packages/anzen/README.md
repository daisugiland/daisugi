# @daisugi/anzen

[![version](https://img.shields.io/npm/v/@daisugi/anzen.svg)](https://www.npmjs.com/package/@daisugi/anzen)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/anzen)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/anzen)](https://bundlephobia.com/result?p=@daisugi/anzen)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Anzen** helps you write safe code without exceptions, inspired by Rust's Result and Haskell's Either.

---

## ✨ Features

- 💡 Minimal size overhead ([details](https://bundlephobia.com/result?p=@daisugi/anzen))
- ⚡️ Written in TypeScript
- 📦 Uses only trusted dependencies
- 🔨 Powerful and agnostic to your code
- 🧪 Well-tested
- 🤝 Used in production
- 🔀 Supports both ES Modules and CommonJS

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

[:top: Back to top](#table-of-contents)

---

## 🚀 Usage

```js
import { Result } from '@daisugi/anzen';
import { readFileSync } from 'node:fs';

function readFile(path) {
  try {
    const response = readFileSync(path);
    return Result.success(response);
  } catch (err) {
    return Result.failure(err);
  }
}

const result = readFile('test.txt');

if (result.isFailure) {
  return result.getError();
}

return result.getValue();
```

[:top: Back to top](#table-of-contents)

---

## 📖 Table of Contents

- [@daisugi/anzen](#daisugianzen)
  - [✨ Features](#-features)
  - [📦 Installation](#-installation)
  - [🚀 Usage](#-usage)
  - [📖 Table of Contents](#-table-of-contents)
  - [🎯 Motivation](#-motivation)
  - [📜 API](#-api)
    - [`#success(value)`](#successvalue)
      - [Example:](#example)
    - [`#failure(err)`](#failureerr)
      - [Example:](#example-1)
    - [`#isSuccess / #isFailure`](#issuccess--isfailure)
      - [Example:](#example-2)
    - [`#getValue()`](#getvalue)
      - [Example:](#example-3)
    - [`#getError()`](#geterror)
      - [Example:](#example-4)
    - [`#getOrElse(value)`](#getorelsevalue)
      - [Example:](#example-5)
    - [`#map(fn)`](#mapfn)
      - [Example:](#example-6)
    - [`#chain(fn)`](#chainfn)
      - [Example:](#example-7)
    - [`#elseChain(fn)`](#elsechainfn)
      - [Example:](#example-8)
    - [`#elseMap(fn)`](#elsemapfn)
      - [Example:](#example-9)
    - [`#unsafeUnwrap()`](#unsafeunwrap)
      - [Example:](#example-10)
    - [`#toJSON()`](#tojson)
      - [Example:](#example-11)
    - [`#fromJSON(json)`](#fromjsonjson)
      - [Example:](#example-12)
    - [`#promiseAll(fns)`](#promiseallfns)
      - [Example:](#example-13)
    - [`#fromThrowable(fn, parseErr)`](#fromthrowablefn-parseerr)
      - [Example:](#example-14)
    - [`#fromSyncThrowable(fn, parseErr)`](#fromsyncthrowablefn-parseerr)
      - [Example:](#example-15)
  - [🔷 TypeScript Support](#-typescript-support)
      - [Example:](#example-16)
  - [🎯 Project Goal](#-project-goal)
  - [🌍 Other Projects](#-other-projects)
  - [📜 License](#-license)

[:top: Back to top](#table-of-contents)

---

## 🎯 Motivation

Anzen was created to provide a simple and predictable way to handle errors, eliminating unexpected exceptions. It is especially useful when:

- Early failures need to be caught and handled.
- You prefer a cleaner, chainable style of error handling.
- You require improved TypeScript support.
- You want a minimal API that covers common use cases in JavaScript without mimicking other languages' patterns entirely.

If you're looking for a robust implementation of the Result pattern, Anzen might be the right choice. Alternatives include [True-Myth](https://true-myth.js.org/) or [Folktale](https://folktale.origamitower.com/).

[:top: Back to top](#table-of-contents)

---

## 📜 API

### `#success(value)`

Creates a successful Result instance representing a successful outcome.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const res = Result.success('foo');
```

[:top: Back to top](#table-of-contents)

---

### `#failure(err)`

Creates a failure Result instance representing an error outcome.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const res = Result.failure('err');
```

[:top: Back to top](#table-of-contents)

---

### `#isSuccess / #isFailure`

Properties that indicate whether the Result is successful or a failure.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const res = Result.success('foo');
console.log(res.isSuccess); // true
console.log(res.isFailure); // false

const errRes = Result.failure('err');
console.log(errRes.isSuccess); // false
console.log(errRes.isFailure); // true
```

[:top: Back to top](#table-of-contents)

---

### `#getValue()`

Returns the value from a successful Result or throws an error if it's a failure.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const value = Result.success('foo').getValue();
// 'foo'
```

[:top: Back to top](#table-of-contents)

---

### `#getError()`

Returns the error from a failure Result or throws an error if it's successful.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const error = Result.failure('err').getError();
// 'err'
```

[:top: Back to top](#table-of-contents)

---

### `#getOrElse(value)`

Returns the Result value if successful, or the provided default value if it is a failure.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const value = Result.failure('err').getOrElse('foo');
// 'foo'
```

[:top: Back to top](#table-of-contents)

---

### `#map(fn)`

Transforms the value of a successful Result using the provided function; if the Result is a failure, it remains unchanged.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const result = Result.success('foo')
  .map((value) => value)
  .getValue();
// 'foo'
```

[:top: Back to top](#table-of-contents)

---

### `#chain(fn)`

Applies a function to the value of a successful Result that returns another Result. For failures, it passes through unchanged.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const result = Result.success('foo')
  .chain((value) => Result.success(value))
  .getValue();
// 'foo'
```

[:top: Back to top](#table-of-contents)

---

### `#elseChain(fn)`

For a failure Result, applies a function to its error value that returns a new Result; if successful, passes the value through.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const result = Result.failure('err')
  .elseChain((err) => Result.success('foo'))
  .getValue();
// 'foo'
```

[:top: Back to top](#table-of-contents)

---

### `#elseMap(fn)`

Transforms the error value of a failure Result using the provided function to return a default value, while leaving successful Results unchanged.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const result = Result.failure('err')
  .elseMap((err) => 'foo')
  .getValue();
// 'foo'
```

[:top: Back to top](#table-of-contents)

---

### `#unsafeUnwrap()`

Retrieves the value or error from the Result without safety checks.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const output = Result.failure('err').unsafeUnwrap();
// 'err'
```

[:top: Back to top](#table-of-contents)

---

### `#toJSON()`

Serializes a Result instance to JSON.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const jsonSuccess = Result.success('foo').toJSON();
// '{ "value": "foo", "isSuccess": true }'

const jsonFailure = Result.failure('err').toJSON();
// '{ "error": "err", "isSuccess": false }'
```

[:top: Back to top](#table-of-contents)

---

### `#fromJSON(json)`

Deserializes a JSON string into a Result instance.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const value = Result.fromJSON('{ "value": "foo", "isSuccess": true }').getValue();
// 'foo'
```

[:top: Back to top](#table-of-contents)

---

### `#promiseAll(fns)`

A helper that wraps `Promise.all` for functions returning Result instances. It returns a success Result if all promises succeed, or a failure if any fail.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const result = await Result.promiseAll([
  async () => Result.success('foo')
]).getValue();
// ['foo']
```

For failure cases:

```js
import { Result } from '@daisugi/anzen';

const error = await Result.promiseAll([
  async () => Result.failure('foo')
]).getError();
// 'foo'
```

[:top: Back to top](#table-of-contents)

---

### `#fromThrowable(fn, parseErr)`

Executes an asynchronous function that might throw an exception. Returns a success Result with the function's output, or a failure Result with the error parsed by `parseErr`.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const result = await Result.fromThrowable(
  async () => { throw new Error('err') },
  (err) => err.message
).getError();
// 'err'
```

[:top: Back to top](#table-of-contents)

---

### `#fromSyncThrowable(fn, parseErr)`

Similar to `fromThrowable`, but for synchronous functions.

#### Example:

```js
import { Result } from '@daisugi/anzen';

const result = Result.fromSyncThrowable(
  () => { throw new Error('err') },
  (err) => err.message
).getError();
// 'err'
```

[:top: Back to top](#table-of-contents)

---

## 🔷 TypeScript Support

Anzen is fully written in TypeScript, offering robust type definitions.

#### Example:

```ts
import {
  Result,
  type AnzenResultSuccess,
  type AnzenResultFailure
} from '@daisugi/anzen';

function foo(): AnzenResultSuccess<string> {
  return Result.success('foo');
}

function bar(): AnzenResultFailure<string> {
  return Result.failure('foo');
}

function baz(): AnzenResultSuccess<number> | AnzenResultFailure<string> {
  if ((Math.random() * 10) % 2 === 0) {
    return Result.success(11);
  }
  return Result.failure('foo');
}
```

[:top: Back to top](#table-of-contents)

---

## 🎯 Project Goal

The aim of Anzen is to provide an abstraction for error handling that simplifies reasoning and ensures predictable outcomes, avoiding unexpected exceptions.

[:top: Back to top](#table-of-contents)

---

## 🌍 Other Projects

Explore the [@daisugi](../../README.md) ecosystem.

[:top: Back to top](#table-of-contents)

---

## 📜 License

[MIT](../../LICENSE)

[:top: Back to top](#table-of-contents)
