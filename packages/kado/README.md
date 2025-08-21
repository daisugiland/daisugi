# @daisugi/kado

[![version](https://img.shields.io/npm/v/@daisugi/kado.svg)](https://www.npmjs.com/package/@daisugi/kado)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/kado)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/kado)](https://bundlephobia.com/result?p=@daisugi/kado)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Kado** is a minimal and unobtrusive inversion of control (IoC) container.

---

## 🌟 Features

- 💡 Minimal size overhead ([see details](https://bundlephobia.com/result?p=@daisugi/kado))
- ⚡️ Written in TypeScript
- 📦 Zero dependencies (while [`@daisugi/ayamari`][ayamari] and [`@daisugi/kintsugi`][kintsugi] integrate seamlessly)
- 🔨 Powerful and agnostic to your code
- 🧪 Well-tested
- 🤝 Used in production
- 🔀 Supports both ES Modules and CommonJS

---

## 📦 Installation

Using npm:

```sh
npm install @daisugi/kado
```

Using pnpm:

```sh
pnpm install @daisugi/kado
```

[:top: Back to top](#-table-of-contents)

---

## 🚀 Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

class Foo {
  constructor(bar) {
    this.bar = bar;
  }
}

class Bar {}

container.register([
  { token: 'Foo', useClass: Foo, params: ['Bar'] },
  { token: 'Bar', useClass: Bar }
]);

const foo = await container.resolve('Foo');
```

[:top: Back to top](#-table-of-contents)

---

## 📖 Table of Contents

- [@daisugi/kado](#daisugikado)
  - [🌟 Features](#-features)
  - [📦 Installation](#-installation)
  - [🚀 Usage](#-usage)
  - [📖 Table of Contents](#-table-of-contents)
  - [🎯 Motivation](#-motivation)
    - [✅ Key Requirements](#-key-requirements)
  - [📜 API](#-api)
    - [`#register(manifestItems)`](#registermanifestitems)
      - [Example:](#example)
    - [`#resolve(token)`](#resolvetoken)
      - [Example:](#example-1)
    - [`#get(token)`](#gettoken)
      - [Example:](#example-2)
    - [`token`](#token)
    - [`useClass`](#useclass)
      - [Example:](#example-3)
    - [`useValue`](#usevalue)
      - [Example:](#example-4)
    - [`useFnByContainer`](#usefnbycontainer)
      - [Example:](#example-5)
    - [`useFn`](#usefn)
      - [Example:](#example-6)
    - [`scope`](#scope)
      - [Example:](#example-7)
    - [`meta`](#meta)
      - [Example:](#example-8)
    - [`params`](#params)
      - [Example:](#example-9)
    - [`#list()`](#list)
      - [Example:](#example-10)
    - [`Kado.value`](#kadovalue)
      - [Example:](#example-11)
    - [`Kado.map`](#kadomap)
      - [Example:](#example-12)
    - [`Kado.flatMap`](#kadoflatmap)
      - [Example:](#example-13)
  - [🔷 TypeScript Support](#-typescript-support)
      - [Example:](#example-14)
  - [🎯 Goal](#-goal)
  - [🌸 Etymology](#-etymology)
  - [🌍 Other Projects](#-other-projects)
  - [📜 License](#-license)


[:top: Back to top](#-table-of-contents)

---

## 🎯 Motivation

Kado was created to address limitations found in other IoC libraries. If these requirements align with your needs, Kado may be a good fit. Otherwise, alternatives like [di-ninja](https://github.com/di-ninja/di-ninja) or [tsyringe](https://github.com/microsoft/tsyringe) might be worth exploring.

### ✅ Key Requirements

- Allows multiple container instances without global state.
- Decouples dependency injection (DI) configuration from base code.
- Supports easy dependency decoration (useful for telemetry, debugging, etc.).
- Avoids annotation-based decorators ([see style guide](https://github.com/daisugiland/javascript-style-guide)).
- Works with pure JavaScript (does not require TypeScript).
- Keeps the API simple yet powerful.

[:top: Back to top](#-table-of-contents)

---

## 📜 API

### `new Kado(kadoConfig?)`

Initializes the container.

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();
```

If either of the [`@daisugi/ayamari`][ayamari] or [`@daisugi/kintsugi`][kintsugi] libraries is not installed, then you have to provide the required dependencies manually. For example:

```js
import { Kado } from '@daisugi/kado';

const errFn = {
  NotFound: Error,
  CircularDependencyDetected: Error,
};
const urandom = Symbol;
const { container } = new Kado({ errFn, urandom });
```

### `#register(manifestItems)`

Registers dependencies in the container.

#### Example:

```js
container.register([{ token: 'Foo' }]);
```

---

### `#resolve(token)`

Resolves a registered dependency.

#### Example:

```js
const foo = await container.resolve('Foo');
```

---

### `#get(token)`

Retrieves a registered manifest item by token.

#### Example:

```js
const manifestItem = container.get('Foo');
```

---

### `token`

A unique identifier for registered dependencies.

---

### `useClass`

Defines a class as a dependency.

#### Example:

```js
container.register([
  { token: 'Foo', useClass: Foo, params: ['Bar'] },
  { token: 'Bar', useClass: Bar }
]);
```

---

### `useValue`

Registers a constant value.

#### Example:

```js
container.register([{ token: 'foo', useValue: 'text' }]);
```

---

### `useFnByContainer`

Passes the container to a factory function.

#### Example:

```js
function bar(c) {
  return c.resolve('Foo');
}

container.register([
  { token: 'Foo', useClass: Foo },
  { token: 'bar', useFnByContainer: bar }
]);
```

---

### `useFn`

Passes specified parameters to a factory function.

#### Example:

```js
function bar(foo) {
  return foo;
}

container.register([
  { token: 'Foo', useClass: Foo },
  { token: 'bar', useFn: bar, params: ['Foo'] }
]);
```

---

### `scope`

Defines the lifecycle of dependencies.

- **`Singleton`** (default) - Reuses the same instance.
- **`Transient`** - Creates a new instance each time.

#### Example:

```js
container.register([
  { token: 'Foo', useClass: Foo, scope: 'Transient' }
]);
```

---

### `meta`

Stores arbitrary metadata.

#### Example:

```js
container.register([{ token: 'Foo', meta: { isFoo: true } }]);
```

---

### `params`

Specifies constructor arguments.

#### Example:

```js
container.register([
  { token: 'Foo', useClass: Foo, params: [{ useValue: 'text' }] }
]);
```

---

### `#list()`

Returns a list of registered dependencies.

#### Example:

```js
const manifestItems = container.list();
```

---

### `Kado.value`

Helper for injecting values.

#### Example:

```js
container.register([
  { token: 'Foo', useClass: Foo, params: [Kado.value('text')] }
]);
```

---

### `Kado.map`

Helper for resolving arrays.

#### Example:

```js
container.register([
  { token: 'bar', useValue: 'text' },
  { token: 'Foo', useClass: Foo, params: [Kado.map(['bar'])] }
]);
```

---

### `Kado.flatMap`

Similar to `Kado.map`, but flattens the result.

#### Example:

```js
container.register([
  { token: 'bar', useValue: ['text'] },
  { token: 'Foo', useClass: Foo, params: [Kado.flatMap(['bar'])] }
]);
```

[:top: Back to top](#-table-of-contents)

---

## 🔷 TypeScript Support

Kado is fully written in TypeScript.

#### Example:

```ts
import {
  Kado,
  type KadoManifestItem,
  type KadoContainer,
  type KadoToken,
  type KadoScope,
  type KadoConfig,
} from '@daisugi/kado';
import { Ayamari } from '@daisugi/ayamari';
import { urandom } from '@daisugi/kintsugi';

const { errFn } = new Ayamari();
const kadoConfig: KadoConfig = { errFn, urandom };

const { container } = new Kado(kadoConfig);

class Foo {}

const myContainer: KadoContainer = container;
const token: KadoToken = 'Foo';
const scope: KadoScope = Kado.scope.Transient;
const manifestItems: KadoManifestItem[] = [
  {
    token,
    useClass: Foo,
    scope,
  }
];

myContainer.register(manifestItems);

const foo = await myContainer.resolve<Foo>('Foo');
```

[:top: Back to top](#-table-of-contents)

---

## 🎯 Goal

Kado aims to provide a simple yet effective IoC solution with minimal overhead.

[:top: Back to top](#-table-of-contents)

---

## 🌸 Etymology

*Kado* (華道) is the Japanese art of flower arrangement, emphasizing form, lines, and balance—similar to how Kado structures dependencies.

[:top: Back to top](#-table-of-contents)

---

## 🌍 Other Projects

Explore the [@daisugi](../../README.md) ecosystem.

[:top: Back to top](#-table-of-contents)

---

## 📜 License

[MIT](../../LICENSE)

[:top: Back to top](#-table-of-contents)

[ayamari]: https://www.npmjs.com/package/@daisugi/ayamari
[kintsugi]: https://www.npmjs.com/package/@daisugi/kintsugi
