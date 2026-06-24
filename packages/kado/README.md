# @daisugi/kado

[![version](https://img.shields.io/npm/v/@daisugi/kado.svg)](https://www.npmjs.com/package/@daisugi/kado)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/kado)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/kado)](https://bundlephobia.com/result?p=@daisugi/kado)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Kado** is a lightweight and unobtrusive inversion of control (IoC) container.

---

## ✨ Features

- 💡 Minimal size overhead ([details](https://bundlephobia.com/result?p=@daisugi/kado))
- ⚡️ Written in TypeScript
- 📦 Zero required dependencies
- 🔨 Powerful and agnostic to your code
- 🧪 Well-tested
- 🤝 Used in production
- 🌳 Tree-shakeable
- 🌐 Universal - runs in the browser and on the server (Node.js)
- 🔀 Supports both ES Modules and CommonJS

---

## 🚀 Usage

Register your dependencies, then resolve them by token. Kado builds them and their dependencies for you.

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
  { token: 'Bar', useClass: Bar },
]);

const foo = await container.resolve('Foo');
```

---

## 📖 Table of Contents

- [@daisugi/kado](#daisugikado)
  - [✨ Features](#-features)
  - [🚀 Usage](#-usage)
  - [📖 Table of Contents](#-table-of-contents)
  - [📦 Installation](#-installation)
  - [🔍 Overview](#-overview)
  - [🎯 Motivation](#-motivation)
    - [✅ Key Requirements](#-key-requirements)
  - [📚 API](#-api)
    - [`container.register(manifestItems)`](#containerregistermanifestitems)
    - [`container.resolve(token)`](#containerresolvetoken)
    - [`container.createChildContainer()`](#containercreatechildcontainer)
    - [`container.get(token)`](#containergettoken)
    - [`container.list()`](#containerlist)
    - [Manifest items](#manifest-items)
    - [`useClass`](#useclass)
    - [`useValue`](#usevalue)
    - [`useFn`](#usefn)
    - [`useFnByContainer`](#usefnbycontainer)
    - [`params`](#params)
    - [`scope`](#scope)
    - [`meta`](#meta)
    - [`scope` (export)](#scope-export)
    - [`value(value)`](#valuevalue)
    - [`map(params)`](#mapparams)
    - [`flatMap(params)`](#flatmapparams)
  - [🔷 TypeScript Support](#-typescript-support)
  - [🎯 Goal](#-goal)
  - [🌸 Etymology](#-etymology)
  - [🌍 Other Projects](#-other-projects)
  - [📜 License](#-license)

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

Kado has no required dependencies. For richer errors (codes, causes, pretty stacks), install [@daisugi/ayamari](../ayamari) and inject its `errs`:

```sh
pnpm install @daisugi/ayamari
```

```ts
import { Kado } from '@daisugi/kado';
import { Ayamari } from '@daisugi/ayamari';

const { errs } = new Ayamari();
const { container } = new Kado({ errs });
```

Without `errs`, Kado throws native `Error`s with a matching `name` and `code` (e.g. `'NotFound'`).

[:top: Back to top](#-table-of-contents)

---

## 🔍 Overview

Kado wires your app together from a declarative manifest, so construction logic stays out of your business code.

It provides:

- ✅ Multiple isolated containers - no global state
- ✅ Child containers that fall through to ancestors
- ✅ Async resolution (`resolve` returns a `Promise`)
- ✅ `Singleton`, `Transient`, and `ContainerScoped` scopes
- ✅ Class, factory, factory-by-container, and value providers
- ✅ Inline, nested dependencies inside `params`
- ✅ Auto-generated tokens when you omit one
- ✅ Built-in circular dependency detection
- ✅ Optional rich errors via [@daisugi/ayamari](../ayamari)

[:top: Back to top](#-table-of-contents)

---

## 🎯 Motivation

Kado was built to fix limits found in other IoC libraries.

If it fits your needs, great. If not, look at [di-ninja](https://github.com/di-ninja/di-ninja) or [tsyringe](https://github.com/microsoft/tsyringe).

### ✅ Key Requirements

- Multiple container instances, with no global state.
- Keeps DI setup separate from your business code.
- Easy to decorate dependencies (for telemetry, debugging, and more).
- No annotation-based decorators.
- Works with plain JavaScript; TypeScript is optional.
- A simple but powerful API.

[:top: Back to top](#-table-of-contents)

---

## 📚 API

A `Kado` instance gives you a `container`. Manifests use the standalone `scope`, `value`, `map`, and `flatMap` helpers, each a named export.

```ts
const { container } = new Kado();
```

### `container.register(manifestItems)`

Registers one or more dependencies. This only records the manifest. Nothing is built until you `resolve`.

```ts
container.register(manifestItems: KadoManifestItem[]): void
```

| Parameter       | Type                 | Description                                  |
| --------------- | -------------------- | -------------------------------------------- |
| `manifestItems` | `KadoManifestItem[]` | Dependencies to register (see [Manifest items](#manifest-items)). |

Each entry is a [manifest item](#manifest-items). `token` is optional; if omitted, Kado generates one. Registering the same token again overwrites the previous entry.

```js
container.register([
  { token: 'Foo', useClass: Foo, params: ['Bar'] },
  { token: 'Bar', useClass: Bar },
]);
```

---

### `container.resolve(token)`

Resolves a dependency, building its `params` first. Always returns a `Promise`.

```ts
container.resolve<T>(token: KadoToken): Promise<T>
```

| Parameter | Type        | Description                          |
| --------- | ----------- | ------------------------------------ |
| `token`   | `KadoToken` | Identifier of the dependency.        |

Returns a `Promise` of the resolved instance (`T`).

- `Singleton` (default): built once and cached. Later resolves return the same instance.
- `Transient`: built fresh on every resolve.
- `ContainerScoped`: built once per container (see [`createChildContainer`](#containercreatechildcontainer)).
- If the token is not registered locally, the lookup falls through to ancestor containers.

---

### `container.createChildContainer()`

Creates a child container. Token lookups fall through to the parent, so children share the parent's registrations while adding or overriding their own.

```ts
container.createChildContainer(): KadoContainer
```

Returns a new `KadoContainer` whose parent is the current container.

- Inherited `Singleton` and `useValue` registrations are shared across the whole chain.
- Inherited `ContainerScoped` registrations are built once per child.
- A token registered on a child shadows the same token on ancestors, for that child only.
- Circular-dependency detection walks the ancestor chain too.

```js
import { Kado, scope } from '@daisugi/kado';

// App-wide singletons live on root.
const { container: root } = new Kado();
root.register([
  { token: 'DbPool', useValue: createDbPool() },
  { token: 'Logger', useClass: Logger },
]);

// One child per unit of work (e.g. an HTTP request).
function handleRequest(req) {
  const scoped = root.createChildContainer();
  scoped.register([
    { token: 'RequestContext', useValue: { userId: req.userId } },
    {
      token: 'UserRepo',
      useClass: UserRepo,
      // `DbPool` falls through to root automatically.
      params: ['DbPool', 'RequestContext'],
      scope: scope.ContainerScoped,
    },
  ]);
  return scoped.resolve('UserRepo');
}
```

> [!NOTE]
> `get()` and `list()` walk the ancestor chain like `resolve()`. `get()` falls through on a local miss; `list()` merges the whole chain, with nearer containers shadowing ancestors.

---

### `container.get(token)`

Returns the registered manifest item for a token. Falls through to ancestors on a local miss.

```ts
container.get(token: KadoToken): KadoManifestItem
```

| Parameter | Type        | Description                          |
| --------- | ----------- | ------------------------------------ |
| `token`   | `KadoToken` | Identifier of the dependency.        |

Throws a `NotFound` error if the token is not registered anywhere in the chain.

```js
const manifestItem = container.get('Foo');
```

---

### `container.list()`

Returns the manifest items visible to the container, including inherited ones.

```ts
container.list(): KadoManifestItem[]
```

Items registered on the container come first (in registration order), then inherited ones. A nearer container shadows its ancestors, so each token appears once.

```js
const manifestItems = container.list();
```

---

### Manifest items

A manifest item describes how one dependency is built. Use exactly one provider field (`useClass`, `useValue`, `useFn`, or `useFnByContainer`) per item.

| Field              | Type                         | Description                          |
| ------------------ | ---------------------------- | ------------------------------------ |
| `token`            | `string \| symbol \| number` | Unique identifier. Auto-generated when omitted. |
| `useClass`         | `Class`                      | Class to instantiate with `new`.     |
| `useValue`         | `any`                        | Constant value returned as-is.       |
| `useFn`            | `(...args) => any`           | Factory called with resolved `params`. |
| `useFnByContainer` | `(container) => any`         | Factory called with the container.   |
| `params`           | `KadoParam[]`                | Dependencies to inject (see [`params`](#params)). |
| `scope`            | `'Singleton' \| 'Transient'` | Lifecycle. Defaults to `Singleton`.  |
| `meta`             | `Record<string, any>`        | Arbitrary metadata, ignored by Kado. |

---

### `useClass`

Defines a class dependency. Its `params` are resolved and passed to the constructor.

```js
container.register([
  { token: 'Foo', useClass: Foo, params: ['Bar'] },
  { token: 'Bar', useClass: Bar },
]);
```

---

### `useValue`

Returns a constant value as-is.

```js
container.register([{ token: 'foo', useValue: 'text' }]);

const foo = await container.resolve('foo'); // 'text'
```

---

### `useFn`

Uses a factory function. Its `params` are resolved and passed as arguments.

```js
function bar(foo) {
  return foo;
}

container.register([
  { token: 'Foo', useClass: Foo },
  { token: 'bar', useFn: bar, params: ['Foo'] },
]);
```

---

### `useFnByContainer`

Uses a factory that receives the container, so it can resolve what it needs on demand.

```js
function bar(container) {
  return container.resolve('Foo');
}

container.register([
  { token: 'Foo', useClass: Foo },
  { token: 'bar', useFnByContainer: bar },
]);
```

---

### `params`

Lists the dependencies injected into `useClass` / `useFn`. Each entry is either a token or an inline manifest item.

```js
container.register([
  // Reference by token, or define inline.
  { token: 'Foo', useClass: Foo, params: ['Bar', { useValue: 'text' }] },
  { token: 'Bar', useClass: Bar },
]);
```

---

### `scope`

Defines a dependency's lifecycle.

- **`Singleton`** (default): one shared instance across the container chain.
- **`Transient`**: a new instance on every resolve.
- **`ContainerScoped`**: one instance per container. See [`container.createChildContainer()`](#containercreatechildcontainer).

```js
container.register([
  { token: 'Foo', useClass: Foo, scope: 'Transient' },
]);
```

---

### `meta`

Stores arbitrary metadata on an item. Kado ignores it; it is there for your own use.

```js
container.register([
  { token: 'Foo', useClass: Foo, meta: { tag: 'service' } },
]);
```

---

### `scope` (export)

A map of the available scope names, so you avoid string literals.

```ts
scope: Record<KadoScope, KadoScope>
```

```js
import { scope } from '@daisugi/kado';

container.register([
  { token: 'Foo', useClass: Foo, scope: scope.Transient },
]);
```

---

### `value(value)`

Builds a `useValue` manifest item, handy for inlining a constant inside `params`.

```ts
value(value: unknown): KadoManifestItem
```

| Parameter | Type      | Description                          |
| --------- | --------- | ------------------------------------ |
| `value`   | `unknown` | The constant value to wrap.          |

```js
import { value } from '@daisugi/kado';

container.register([
  { token: 'Foo', useClass: Foo, params: [value('text')] },
]);
```

---

### `map(params)`

Resolves a list of `params` into an array, ready to inject.

```ts
map(params: KadoParam[]): KadoManifestItem
```

| Parameter | Type          | Description                          |
| --------- | ------------- | ------------------------------------ |
| `params`  | `KadoParam[]` | Dependencies collected into an array. |

```js
import { map } from '@daisugi/kado';

container.register([
  { token: 'bar', useValue: 'text' },
  { token: 'Foo', useClass: Foo, params: [map(['bar'])] },
]);

// Foo receives ['text'].
```

---

### `flatMap(params)`

Like [`map`](#mapparams), but flattens the resolved array one level.

```ts
flatMap(params: KadoParam[]): KadoManifestItem
```

| Parameter | Type          | Description                          |
| --------- | ------------- | ------------------------------------ |
| `params`  | `KadoParam[]` | Dependencies collected, then flattened one level. |

```js
import { flatMap } from '@daisugi/kado';

container.register([
  { token: 'bar', useValue: ['a', 'b'] },
  { token: 'Foo', useClass: Foo, params: [flatMap(['bar'])] },
]);

// Foo receives ['a', 'b'].
```

[:top: Back to top](#-table-of-contents)

---

## 🔷 TypeScript Support

Kado is written in TypeScript and ships its own types. `resolve` is generic, so you can pin the resolved type.

```ts
import {
  Kado,
  type KadoManifestItem,
  type KadoContainer,
  type KadoToken,
  type KadoScope,
} from '@daisugi/kado';

const { container } = new Kado();

class Foo {}

const myContainer: KadoContainer = container;
const token: KadoToken = 'Foo';
const scope: KadoScope = 'Transient';
const manifestItems: KadoManifestItem[] = [
  {
    token,
    useClass: Foo,
    scope,
  },
];

myContainer.register(manifestItems);

const foo = await myContainer.resolve<Foo>('Foo');
```

[:top: Back to top](#-table-of-contents)

---

## 🎯 Goal

Kado aims to be a simple yet effective IoC solution with minimal overhead.

[:top: Back to top](#-table-of-contents)

---

## 🌸 Etymology

*Kado* (華道) is the Japanese art of flower arrangement, focused on form, lines, and balance. Much like how Kado structures dependencies.

[:top: Back to top](#-table-of-contents)

---

## 🌍 Other Projects

[Meet the ecosystem](../../README.md)

[:top: Back to top](#-table-of-contents)

---

## 📜 License

[MIT](../../LICENSE)

[:top: Back to top](#-table-of-contents)
