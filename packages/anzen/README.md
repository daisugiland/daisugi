# @daisugi/anzen

[![version](https://img.shields.io/npm/v/@daisugi/anzen.svg)](https://www.npmjs.com/package/@daisugi/anzen)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/anzen)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/anzen)](https://bundlephobia.com/result?p=@daisugi/anzen)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Anzen** helps write safe code without exceptions, taking roots from Rust's Result and Haskell's Either.

## 🌟 Features

- 💡 Minimum size [overhead](https://bundlephobia.com/result?p=@daisugi/anzen).
- ⚡️ Written in TypeScript.
- 📦 Only uses trusted dependencies.
- 🔨 Powerful and agnostic to your code.
- 🧪 Well tested.
- 🤝 Is used in production.
- ⚡️ Exports ES Modules as well as CommonJS.

## Usage

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

// This line may fail unexpectedly without warnings.
const text = readFile('test.txt');

if (text.isFailure) {
  return text.getError();
}

return text.getValue();
```

## Table of contents

- [@daisugi/anzen](#daisugianzen)
  - [🌟 Features](#-features)
  - [Usage](#usage)
  - [Table of contents](#table-of-contents)
  - [Install](#install)
  - [Motivation](#motivation)
    - [#success(value)](#successvalue)
      - [Usage](#usage-1)
    - [#failure(err)](#failureerr)
      - [Usage](#usage-2)
    - [#isSuccess/#isFailure](#issuccessisfailure)
      - [Usage](#usage-3)
    - [#getValue()](#getvalue)
      - [Usage](#usage-4)
    - [#getError()](#geterror)
      - [Usage](#usage-5)
    - [#getOrElse(value)](#getorelsevalue)
      - [Usage](#usage-6)
    - [#map(fn)](#mapfn)
      - [Usage](#usage-7)
    - [#chain(fn)](#chainfn)
      - [Usage](#usage-8)
    - [#elseChain(fn)](#elsechainfn)
      - [Usage](#usage-9)
    - [#elseMap(fn)](#elsemapfn)
      - [Usage](#usage-10)
    - [#unsafeUnwrap()](#unsafeunwrap)
      - [Usage](#usage-11)
    - [#toJSON()](#tojson)
      - [Usage](#usage-12)
    - [#fromJSON(json)](#fromjsonjson)
      - [Usage](#usage-13)
    - [#promiseAll(fns)](#promiseallfns)
      - [Usage](#usage-14)
    - [#fromThrowable(fn, parseErr)](#fromthrowablefn-parseerr)
      - [Usage](#usage-15)
    - [#fromSyncThrowable(fn, parseErr)](#fromsyncthrowablefn-parseerr)
      - [Usage](#usage-16)
  - [TypeScript](#typescript)
  - [Goal](#goal)
  - [Other projects](#other-projects)
  - [License](#license)

## Install

Using npm:

```sh
npm install @daisugi/anzen
```

Using yarn:

```sh
yarn add @daisugi/anzen
```

[:top: back to top](#table-of-contents)

## Motivation

This library was created to address certain requirements that were not being fully met by other libraries of the same type, some libraries only partially met the requirements, while others fulfilled everything but also came with unnecessary overhead for the project.

If you are looking for a library that meets any of the following requirements, feel free to use this library. However, there are many other good libraries out there that implement the Result pattern, such as [True-Myth](https://true-myth.js.org/) or [Folktale](https://folktale.origamitower.com/), that you can also use.

- ✅ Early failures in invalid operations.
- ✅ Can be written in a cleaner style, avoiding the need for chains.
- ✅ Provides better TypeScript typing.
- ✅ Keeps the API simple and does not try to mimic the Rust API or any other, but includes enough features to cover the most common use cases in the JavaScript world.

[:top: back to top](#table-of-contents)

### #success(value)

Creates the successful variant instance of the Result, representing a successful outcome from an operation which may fail.

#### Usage

```js
import { Result } from '@daisugi/anzen';

const res = Result.success('foo');
```

[:top: back to top](#table-of-contents)

### #failure(err)

Creates the failure variant instance of the Result, representing a failure outcome from an operation which may fail.

#### Usage

```js
import { Result } from '@daisugi/anzen';

const res = Result.failure('err');
```

[:top: back to top](#table-of-contents)

### #isSuccess/#isFailure

Properties that indicates if the Result is a success or failure instance.

#### Usage

```js
import { Result } from '@daisugi/anzen';

const res = Result.success('foo');
res.isSuccess;
// true
res.isFailure;
// false

const errRes = Result.failure('err');
errRes.isSuccess;
// false
errRes.isFailure;
// true
```

[:top: back to top](#table-of-contents)

### #getValue()

Returns an value when comes from a success Result, and throws an error if comes from a failure instance.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.success('foo').getValue();
// 'foo'
```

[:top: back to top](#table-of-contents)

### #getError()

Returns an error value when comes from a failure Result, and throws an error if comes from a success instance.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.failure('err').getError();
// 'err'
```

[:top: back to top](#table-of-contents)

### #getOrElse(value)

If the Result is a success, the function returns the value; if it's a failure, it returns the provided value.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.failure('err').getOrElse('foo');
// 'foo'
```

[:top: back to top](#table-of-contents)

### #map(fn)

Map over a Result instance, apply the callback to the Result value and returns an success instance, and the same failure instance if maps over a failure.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.success('foo')
  .map((value) => value)
  .getValue();
// 'foo'
```

[:top: back to top](#table-of-contents)

### #chain(fn)

Map over a Result instance, apply the callback to the Result value and returns it, and the same failure instance if maps over a failure.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.success('foo')
  .chain((value) => Result.success(value))
  .getValue();
// 'foo'
```

### #elseChain(fn)

Map over a Result instance as in each and get out the value if result is success, or apply a function (elseChain) to the value wrapped in the failure to get a default value.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.failure('err')
  .elseChain((err) => Result.success('foo'))
  .getValue();
// 'foo'
```

[:top: back to top](#table-of-contents)

### #elseMap(fn)

Map over a Result instance as in map and get out the value if result is success, or apply a function (elseChain) to the value wrapped in the failure to get a default value.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.failure('err')
  .elseMap((err) => 'foo')
  .getValue();
// 'foo'
```

### #unsafeUnwrap()

Retrieves the value/error from the Result, it can extract the value/error from a success or failure instances.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.failure('err').unsafeUnwrap();
// 'err'
```

[:top: back to top](#table-of-contents)

### #toJSON()

Useful to serialize to JSON a Result instance.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.success('foo').toJSON();
// '{ "value": "foo", "isSuccess": true }'

Result.failure('err').toJSON();
// '{ "error": "err", "isSuccess": false }'
```

[:top: back to top](#table-of-contents)

### #fromJSON(json)

Useful to deserialize from JSON Result instance like.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.fromJSON('{ "value": "foo", "isSuccess": true }')
  .getValue();
// 'foo'
```

[:top: back to top](#table-of-contents)

### #promiseAll(fns)

A wrapper over Promise.all which helps work with promises whose returns a Result instances.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.promiseAll([
  async () => Result.success('foo')
])
  .getValue();
// ['foo']
```

In case of failure:

```js
import { Result } from '@daisugi/anzen';

Result.promiseAll([
  async () => Result.failure('foo')
])
  .getError();
// 'foo'
```

[:top: back to top](#table-of-contents)

### #fromThrowable(fn, parseErr)

This function executes an asynchronous function that could potentially raise an exception. It returns a success Result containing the function's return value if it executes successfully. Otherwise, it returns a failure Result containing the raised exception.

#### Usage

```js
import { Result } from '@daisugi/anzen';

await Result.fromThrowable(
  async () => throw new Error('err'),
  (err) => err.message,
)
  .getError();
// 'err'
```

[:top: back to top](#table-of-contents)

### #fromSyncThrowable(fn, parseErr)

This function is similar to `fromThrowable`, but it requires a synchronous function to be provided.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.fromSyncThrowable(
  () => throw new Error('err'),
  (err) => err.message,
)
  .getError();
// 'err'
```

[:top: back to top](#table-of-contents)

## TypeScript

The Anzen is fully written in TypeScript, therefore you have available some types.

```ts
import {
  Result,
  type AnzenResultAny,
  type AnzenResultSuccess,
  type AnzenResultFailure,
} from '@daisugi/anzen';

function foo(): AnzenResultSuccess<string> {
  return Result.success('foo');
}

function bar(): AnzenResultFailure<string> {
  return Result.failure('foo');
}

function baz(): AnzenAnyResult<string, number> {
  if ((Math.random() * 10) % 2 === 0) {
    return Result.success(11);
  }
  return Result.failure('foo')
}
```

[:top: back to top](#table-of-contents)

## Goal

The goal is to create an abstraction over errors that simplifies reasoning and ensures predictable results, thereby avoiding unexpected exceptions.

[:top: back to top](#table-of-contents)

## Other projects

[Meet the ecosystem](../../README.md)

[:top: back to top](#table-of-contents)

## License

[MIT](../../LICENSE)
