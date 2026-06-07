# @daisugi/kado

[![version](https://img.shields.io/npm/v/@daisugi/kado.svg)](https://www.npmjs.com/package/@daisugi/kado)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/kado)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/kado)](https://bundlephobia.com/result?p=@daisugi/kado)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Kado** is a minimal and unobtrusive inversion of control (IoC) container.

---

## ✨ Features

- 💡 Minimal size overhead ([details](https://bundlephobia.com/result?p=@daisugi/kado))
- ⚡️ Written in TypeScript
- 📦 Uses only trusted dependencies
- 🔨 Powerful and agnostic to your code
- 🧪 Well-tested
- 🤝 Used in production
- 🔀 Supports both ES Modules and CommonJS

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
    - [`Kado.scope`](#kadoscope)
    - [`Kado.value`](#kadovalue)
    - [`Kado.map`](#kadomap)
    - [`Kado.flatMap`](#kadoflatmap)
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

[:top: Back to top](#-table-of-contents)

---

## 🔍 Overview

**Kado** wires your application together by resolving dependencies from a declarative manifest, so construction logic stays out of your business code. It provides:

- ✅ Multiple isolated containers — no global state
- ✅ Child containers with fall-through resolution to ancestors
- ✅ Async resolution (`resolve` returns a `Promise`)
- ✅ `Singleton` (cached), `Transient` (per-resolve), and `ContainerScoped` (per-container) scopes
- ✅ Class, factory, factory-by-container, and value providers
- ✅ Inline, nested dependency definitions inside `params`
- ✅ Auto-generated tokens when you omit one
- ✅ Built-in circular dependency detection
- ✅ Rich errors via [@daisugi/ayamari](../ayamari)

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

## 📚 API

A `Kado` instance exposes a `container` plus a set of static helpers:

```ts
const { container } = new Kado();
```

### `container.register(manifestItems)`

Registers one or more dependencies in the container. Registration only records the manifest — nothing is instantiated until you `resolve`.

```ts
container.register(manifestItems: KadoManifestItem[]): void
```

| Parameter | Type | Description |
|---|---|---|
| `manifestItems` | `KadoManifestItem[]` | The dependencies to register (see [Manifest items](#manifest-items)). |

Each entry is a [manifest item](#manifest-items). The `token` is optional; when omitted, Kado generates a unique one for you. Registering is idempotent per token — registering the same token again overwrites the previous entry.

```js
container.register([
  { token: 'Foo', useClass: Foo, params: ['Bar'] },
  { token: 'Bar', useClass: Bar },
]);
```

---

### `container.resolve(token)`

Resolves a registered dependency, recursively building its `params` first. Always returns a `Promise`.

```ts
container.resolve<T>(token: KadoToken): Promise<T>
```

| Parameter | Type | Description |
|---|---|---|
| `token` | `KadoToken` | Identifier of the dependency to resolve. |

Returns a `Promise` of the resolved instance (`T`).

- `Singleton` (default) dependencies are built once and cached; subsequent resolves return the same instance.
- `Transient` dependencies are rebuilt on every resolve.
- `ContainerScoped` dependencies are built once per container (see [`createChildContainer`](#containercreatechildcontainer)).
- When a `token` is not registered locally, lookup falls through to the parent container and up the ancestor chain.
- Throws a `NotFound` error if the `token` is not registered anywhere in the chain.
- Throws a `CircularDependencyDetected` error if the dependency graph contains a cycle.

```js
const foo = await container.resolve('Foo');
```

---

### `container.createChildContainer()`

Creates a child container. Token lookup falls through to the parent (and its ancestors) when a token is not registered locally, so children share their parents' registrations while adding or overriding their own.

```ts
container.createChildContainer(): KadoContainer
```

Returns a new `KadoContainer` whose `#parent` is the current container.

- Inherited `Singleton` and `useValue` registrations are shared across the whole chain — resolved once, cached on the owning ancestor.
- Inherited `ContainerScoped` registrations are isolated per child — each container that resolves the token builds and caches its own instance.
- A token registered on the child shadows the same token on an ancestor for that child only.
- Circular-dependency detection walks the ancestor chain, so cross-level `params` are validated too.

```js
// App-wide singletons live on the root.
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
      // `DbPool` falls through to the root automatically.
      params: ['DbPool', 'RequestContext'],
      scope: Kado.scope.ContainerScoped,
    },
  ]);
  return scoped.resolve('UserRepo');
}
```

> [!NOTE]
> `get()` and `list()` walk the ancestor chain like `resolve()`. `get()` falls through to the parent on a local miss; `list()` merges the whole chain, where a nearer container shadows its ancestors and each token appears once.

---

### `container.get(token)`

Retrieves the registered manifest item for a token, without resolving it. Useful for inspection and decoration.

```ts
container.get(token: KadoToken): KadoManifestItem
```

| Parameter | Type | Description |
|---|---|---|
| `token` | `KadoToken` | Identifier of the registered dependency. |

Returns the registered `KadoManifestItem`. Falls through to the parent container on a local miss. Throws a `NotFound` error if the `token` is not registered anywhere in the chain.

```js
const manifestItem = container.get('Foo');
```

---

### `container.list()`

Returns the manifest items for every dependency visible to the container, including those inherited from ancestors.

```ts
container.list(): KadoManifestItem[]
```

Takes no parameters. Items registered on this container come first (in registration order), followed by inherited ones. A nearer container shadows its ancestors, so each token appears once.

```js
const manifestItems = container.list();
```

---

### Manifest items

A manifest item describes how a single dependency is built. Exactly one provider field (`useClass`, `useValue`, `useFn`, or `useFnByContainer`) is expected per item.

| Field | Type | Description |
|---|---|---|
| `token` | `string \| symbol \| number` | Unique identifier. Auto-generated when omitted. |
| `useClass` | `Class` | Class to instantiate with `new`. |
| `useValue` | `any` | Constant value returned as-is. |
| `useFn` | `(...args) => any` | Factory called with the resolved `params`. |
| `useFnByContainer` | `(container) => any` | Factory called with the container itself. |
| `params` | `KadoParam[]` | Dependencies to inject (see [`params`](#params)). |
| `scope` | `'Singleton' \| 'Transient'` | Lifecycle. Defaults to `Singleton`. |
| `meta` | `Record<string, any>` | Arbitrary metadata, ignored by Kado. |

---

### `useClass`

Defines a class as a dependency. Its `params` are resolved and passed to the constructor.

```js
container.register([
  { token: 'Foo', useClass: Foo, params: ['Bar'] },
  { token: 'Bar', useClass: Bar },
]);
```

---

### `useValue`

Registers a constant value. Returned as-is, never instantiated, and unaffected by `scope`.

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

Uses a factory function that receives the container, so it can resolve whatever it needs on demand.

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

Specifies the dependencies injected into `useClass` / `useFn`. Each entry is either a `token` referencing another registered dependency, or an inline manifest item that is registered on the fly.

```js
container.register([
  // Reference by token, or define inline.
  { token: 'Foo', useClass: Foo, params: ['Bar', { useValue: 'text' }] },
  { token: 'Bar', useClass: Bar },
]);
```

---

### `scope`

Defines the lifecycle of a dependency.

- **`Singleton`** (default) — reuses the same instance across resolves, shared by the whole container chain.
- **`Transient`** — creates a new instance on each resolve.
- **`ContainerScoped`** — caches one instance per container. Behaves like `Singleton` within a container and like `Transient` across sibling containers. See [`container.createChildContainer()`](#containercreatechildcontainer).

```js
container.register([
  { token: 'Foo', useClass: Foo, scope: 'Transient' },
]);
```

---

### `meta`

Stores arbitrary metadata on a manifest item. Kado never reads it — it's there for your own tooling (telemetry, grouping, conditional wiring, etc.).

```js
container.register([{ token: 'Foo', useClass: Foo, meta: { isFoo: true } }]);

container.get('Foo').meta; // { isFoo: true }
```

---

### `Kado.scope`

A static map of the available scope names, handy for avoiding string literals.

```ts
Kado.scope: Record<KadoScope, KadoScope>
```

```js
container.register([
  { token: 'Foo', useClass: Foo, scope: Kado.scope.Transient },
]);
```

---

### `Kado.value`

Helper that builds a `useValue` manifest item, for inlining a constant inside `params`.

```ts
Kado.value(value: unknown): KadoManifestItem
```

| Parameter | Type | Description |
|---|---|---|
| `value` | `unknown` | The constant value to wrap as a manifest item. |

```js
container.register([
  { token: 'Foo', useClass: Foo, params: [Kado.value('text')] },
]);
```

---

### `Kado.map`

Helper that resolves a list of `params` into an array, ready to inject.

```ts
Kado.map(params: KadoParam[]): KadoManifestItem
```

| Parameter | Type | Description |
|---|---|---|
| `params` | `KadoParam[]` | Dependencies resolved and collected into an array. |

```js
container.register([
  { token: 'bar', useValue: 'text' },
  { token: 'Foo', useClass: Foo, params: [Kado.map(['bar'])] },
]);

// Foo receives ['text'].
```

---

### `Kado.flatMap`

Like [`Kado.map`](#kadomap), but flattens the resolved array one level.

```ts
Kado.flatMap(params: KadoParam[]): KadoManifestItem
```

| Parameter | Type | Description |
|---|---|---|
| `params` | `KadoParam[]` | Dependencies resolved into an array, then flattened one level. |

```js
container.register([
  { token: 'bar', useValue: ['text'] },
  { token: 'Foo', useClass: Foo, params: [Kado.flatMap(['bar'])] },
]);

// Foo receives ['text'], not [['text']].
```

[:top: Back to top](#-table-of-contents)

---

## 🔷 TypeScript Support

Kado is fully written in TypeScript and ships its own types. `resolve` is generic, so you can pin the resolved type.

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
const scope: KadoScope = Kado.scope.Transient;
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

Kado aims to provide a simple yet effective IoC solution with minimal overhead.

[:top: Back to top](#-table-of-contents)

---

## 🌸 Etymology

*Kado* (華道) is the Japanese art of flower arrangement, emphasizing form, lines, and balance—similar to how Kado structures dependencies.

[:top: Back to top](#-table-of-contents)

---

## 🌍 Other Projects

[Meet the ecosystem](../../README.md)

[:top: Back to top](#-table-of-contents)

---

## 📜 License

[MIT](../../LICENSE)

[:top: Back to top](#-table-of-contents)
