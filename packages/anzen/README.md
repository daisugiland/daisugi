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
    - [#map(fn)](#mapfn)
      - [Usage](#usage-6)
    - [#chain(fn)](#chainfn)
      - [Usage](#usage-7)
    - [#elseChain(fn)](#elsechainfn)
      - [Usage](#usage-8)
    - [#elseMap(fn)](#elsemapfn)
      - [Usage](#usage-9)
    - [#unsafeUnwrap()](#unsafeunwrap)
      - [Usage](#usage-10)
    - [#toJSON()](#tojson)
      - [Usage](#usage-11)
    - [#fromJSON(json)](#fromjsonjson)
      - [Usage](#usage-12)
    - [#promiseAll(fns)](#promiseallfns)
      - [Usage](#usage-13)
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

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla magna quam, interdum sit amet pretium et, placerat ut nulla.

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

Returns an value when cames from a success Result, and throws an error if cames from a failure instance.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.success('foo').getValue();
// 'foo'
```

[:top: back to top](#table-of-contents)

### #getError()

Returns an error value when cames from a failure Result, and throws an error if cames from a success instance.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.failure('err').getError();
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

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla magna quam, interdum sit amet pretium et, placerat ut nulla.

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

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla magna quam, interdum sit amet pretium et, placerat ut nulla.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.failure('err')
  .elseMap((err) => 'foo')
  .getValue();
// 'foo'
```

### #unsafeUnwrap()

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla magna quam, interdum sit amet pretium et, placerat ut nulla.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.failure('err').unsafeUnwrap();
// 'err'
```

[:top: back to top](#table-of-contents)

### #toJSON()

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla magna quam, interdum sit amet pretium et, placerat ut nulla.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.success('foo').toJSON();
// "{ "value": "foo", "isSuccess": true }"

Result.failure('err').toJSON();
// "{ "error": "err", "isSuccess": false }"
```

[:top: back to top](#table-of-contents)

### #fromJSON(json)

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla magna quam, interdum sit amet pretium et, placerat ut nulla.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.fromJSON('{ "value": "foo", "isSuccess": true }')
  .getValue();
// 'foo'
```

### #promiseAll(fns)

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla magna quam, interdum sit amet pretium et, placerat ut nulla.

#### Usage

```js
import { Result } from '@daisugi/anzen';

Result.promiseAll([
  async () => Result.success('foo')
])
  .getValue();
// ['foo']
```

[:top: back to top](#table-of-contents)

## Goal

The

[:top: back to top](#table-of-contents)

## Other projects

[Meet the ecosystem](../../README.md)

[:top: back to top](#table-of-contents)

## License

[MIT](../../LICENSE)
