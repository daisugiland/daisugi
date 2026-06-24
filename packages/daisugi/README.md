# @daisugi/daisugi

[![version](https://img.shields.io/npm/v/@daisugi/daisugi.svg)](https://www.npmjs.com/package/@daisugi/daisugi)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/daisugi)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/daisugi)](https://bundlephobia.com/result?p=@daisugi/daisugi)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Daisugi** is a minimalist, functional middleware engine. It runs a list of functions as a pipeline you can read top to bottom.

---

## ✨ Features

- 💡 Minimal size overhead ([details](https://bundlephobia.com/result?p=@daisugi/daisugi))
- ⚡️ Written in TypeScript
- 📦 Uses only trusted dependencies
- 🔨 Powerful and agnostic to your code
- 🧪 Well-tested
- 🤝 Used in production
- 🌳 Tree-shakeable
- 🌐 Universal - runs in the browser and on the server (Node.js)
- 🔀 Supports both ES Modules and CommonJS

---

## 🚀 Usage

Pass your functions to a sequence. Each one receives the previous return value.

```js
import { createSequenceOf } from '@daisugi/daisugi';

const sequenceOf = createSequenceOf();

function addName(arg) {
  return `${arg} John`;
}

function addLastName(arg) {
  return `${arg} Doe.`;
}

const handler = sequenceOf([addName, addLastName]);

handler('Hi');
// Hi John Doe.
```

---

## 📖 Table of Contents

- [@daisugi/daisugi](#daisugidaisugi)
  - [✨ Features](#-features)
  - [🚀 Usage](#-usage)
  - [📖 Table of Contents](#-table-of-contents)
  - [📦 Installation](#-installation)
  - [🔍 Overview](#-overview)
  - [🎯 Motivation](#-motivation)
    - [✅ Key Requirements](#-key-requirements)
  - [📚 API](#-api)
    - [`createSequenceOf(decorators?, opts?)`](#createsequenceofdecorators-opts)
    - [`sequenceOf(handlers)`](#sequenceofhandlers)
    - [`handler.meta`](#handlermeta)
    - [`flow`](#flow)
    - [`stopWith(value)`](#stopwithvalue)
    - [`failWith(value)`](#failwithvalue)
  - [🧩 Patterns](#-patterns)
    - [Downstream](#downstream)
    - [Cascading (downstream/upstream)](#cascading-downstreamupstream)
    - [Sync and async](#sync-and-async)
    - [Nesting](#nesting)
    - [Multiple arguments](#multiple-arguments)
    - [Decorators](#decorators)
  - [🔷 TypeScript Support](#-typescript-support)
  - [🎯 Goal](#-goal)
  - [🌲 Etymology](#-etymology)
  - [🌍 Other Projects](#-other-projects)
  - [📜 License](#-license)

---

## 📦 Installation

Using npm:

```sh
npm install @daisugi/daisugi
```

Using pnpm:

```sh
pnpm install @daisugi/daisugi
```

Daisugi has no required runtime setup. For richer errors (codes, causes, pretty stacks) from `failWith` and `stopWith`, install [@daisugi/ayamari](../ayamari) and inject its `errs`:

```sh
pnpm install @daisugi/ayamari
```

```ts
import { createSequenceOf } from '@daisugi/daisugi';
import { Ayamari } from '@daisugi/ayamari';

const { errs } = new Ayamari();
const sequenceOf = createSequenceOf([], { errs });
```

Without `errs`, Daisugi builds native `Error`s with a matching `name` and `code` (`'Fail'` and `'StopPropagation'`).

[:top: Back to top](#-table-of-contents)

---

## 🔍 Overview

Daisugi composes a list of functions (handlers) into a single function. You call it with an input, and the value flows through each handler in order.

It provides:

- ✅ Sequential (downstream) flow, like a pipe.
- ✅ Cascading (downstream/upstream) flow, like [Koa](https://github.com/koajs/koa) middleware.
- ✅ Sync and async handlers, mixed freely.
- ✅ Nested sequences - a sequence is just another handler.
- ✅ Flow control with `stopWith` and `failWith`.
- ✅ Decorators that wrap every handler.
- ✅ Optional rich errors via [@daisugi/ayamari](../ayamari).

[:top: Back to top](#-table-of-contents)

---

## 🎯 Motivation

Daisugi keeps the core tiny and pushes features into the handlers and decorators you add. It organizes your code into a clear execution pipeline, and it is not tied to HTTP.

If it fits your needs, great. If not, look at [Koa](https://github.com/koajs/koa).

### ✅ Key Requirements

- Read your flow top to bottom, as a plain list of functions.
- Mix sync and async handlers without changing the call site.
- Extend behavior with decorators, not framework hooks.
- Works with plain JavaScript; TypeScript is optional.
- A simple but powerful API.

[:top: Back to top](#-table-of-contents)

---

## 📚 API

Every function below is importable from `@daisugi/daisugi`.

### `createSequenceOf(decorators?, opts?)`

Creates a `sequenceOf` function. Pass `decorators` to wrap every handler, and `opts.errs` to control the errors that `failWith` / `stopWith` build.

```ts
createSequenceOf(
  decorators?: DaisugiHandlerDecorator[],
  opts?: { errs?: DaisugiErrs },
): <Args, Return>(handlers: DaisugiHandler[]) => DaisugiHandler<Args, Return>
```

| Parameter    | Type                         | Description                                          |
| ------------ | ---------------------------- | ---------------------------------------------------- |
| `decorators` | `DaisugiHandlerDecorator[]`  | Wrappers applied to each handler. Defaults to `[]`.  |
| `opts.errs`  | `DaisugiErrs`                | Error factory for flow control. Defaults to native errors. |

```js
import { createSequenceOf } from '@daisugi/daisugi';

const sequenceOf = createSequenceOf();
```

---

### `sequenceOf(handlers)`

Composes handlers into one handler. Calling it runs each handler in order, passing the previous return value to the next.

```ts
sequenceOf<Args, Return>(handlers: DaisugiHandler[]): DaisugiHandler<Args, Return>
```

| Parameter  | Type               | Description                          |
| ---------- | ------------------ | ------------------------------------ |
| `handlers` | `DaisugiHandler[]` | Functions to run, in order.          |

```js
function a(arg) {
  return `${arg}1`;
}

function b(arg) {
  return `${arg}2`;
}

sequenceOf([a, b])('0');
// 012
```

---

### `handler.meta`

Optional metadata you set on a handler to change how Daisugi treats it.

| Field      | Type      | Description                                                       |
| ---------- | --------- | ----------------------------------------------------------------- |
| `withFlow` | `boolean` | Pass the [`flow`](#flow) object as the last argument.             |
| `isAsync`  | `boolean` | Force async detection. Set it for transpiled or wrapped handlers. |

```js
function addName(arg, flow) {
  return flow.next();
}

addName.meta = { withFlow: true };
```

> Daisugi detects async handlers from `constructor.name`, which only holds for native `async function`s. If a handler is transpiled or wrapped, set `meta.isAsync` to override it.

---

### `flow`

Passed as the last argument when a handler sets `meta.withFlow = true`. It hands control to the rest of the sequence and back.

| Member                 | Description                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| `flow.next()`          | Run the rest of the sequence with the current arguments, and return its result. |
| `flow.next(...args)`   | Same as `next()`, but with arguments you choose.                     |
| `flow.failWith(value)` | Stop every sequence and return an Err (see [`failWith`](#failwithvalue)). |

```js
import { createSequenceOf } from '@daisugi/daisugi';

const sequenceOf = createSequenceOf();

function a(arg, flow) {
  return flow.next(`${arg}1`);
}

a.meta = { withFlow: true };

function b(arg) {
  return `${arg}2`;
}

sequenceOf([a, b])('0');
// 012
```

---

### `stopWith(value)`

Stops the current sequence and returns `value`. Outer sequences keep running.

```ts
stopWith(value: unknown): AnzenResultErr<Error>
```

| Parameter | Type      | Description                          |
| --------- | --------- | ------------------------------------ |
| `value`   | `unknown` | The value to return from the sequence. |

```js
import { createSequenceOf, stopWith } from '@daisugi/daisugi';

const sequenceOf = createSequenceOf();

function a(arg) {
  return stopWith(`${arg}1`);
}

function b(arg) {
  return `${arg}2`;
}

sequenceOf([a, b])('0');
// 01
```

---

### `failWith(value)`

Stops every sequence and returns an [Anzen](../anzen) `Err` wrapping `value`. Read it with `.unwrapErr().meta.value`.

```ts
failWith(value: unknown): AnzenResultErr<Error>
```

| Parameter | Type      | Description                          |
| --------- | --------- | ------------------------------------ |
| `value`   | `unknown` | The value attached to the error.     |

```js
import { createSequenceOf, failWith } from '@daisugi/daisugi';

const sequenceOf = createSequenceOf();

function a(arg) {
  return failWith(`${arg}1`);
}

function b(arg) {
  return `${arg}2`;
}

const result = sequenceOf([a, b])('0');

result.isErr; // true
result.unwrapErr().meta.value; // 01
```

[:top: Back to top](#-table-of-contents)

---

## 🧩 Patterns

### Downstream

The default flow. Each handler runs in order, like a pipe.

```js
import { createSequenceOf } from '@daisugi/daisugi';

const sequenceOf = createSequenceOf();

function addName(arg) {
  return `${arg} John.`;
}

sequenceOf([addName])('Hi');
// Hi John.
```

### Cascading (downstream/upstream)

Hand control downstream with `flow.next()`, then keep working when it returns. This is the [Koa](https://github.com/koajs/koa)-style flow, useful for tracing, logging, or timing. Opt in with `meta.withFlow`.

```js
import { createSequenceOf } from '@daisugi/daisugi';

const sequenceOf = createSequenceOf();

function addName(arg, flow) {
  arg.value = `${arg.value} John`;
  return flow.next();
}

addName.meta = { withFlow: true };

function addLastName(arg) {
  return `${arg.value} Doe.`;
}

sequenceOf([addName, addLastName])({ value: 'Hi' });
// Hi John Doe.
```

### Sync and async

Handlers can be sync or async, and you can mix them. Await the result if any handler is async.

```js
import { createSequenceOf } from '@daisugi/daisugi';

const sequenceOf = createSequenceOf();

async function waitForName(arg, flow) {
  return await flow.next();
}

waitForName.meta = { withFlow: true };

async function addName(arg) {
  return `${arg} John.`;
}

await sequenceOf([waitForName, addName])('Hi');
// Hi John.
```

> Strict cascade order (downstream then upstream, in reverse) holds when every handler is async. A sync handler cannot `await` an async downstream, so mixing the two does not preserve that order. Make every handler in the cascade async when order matters.

### Nesting

A sequence is just another handler, so you can nest one inside another.

```js
import { createSequenceOf } from '@daisugi/daisugi';

const sequenceOf = createSequenceOf();

function addName(arg) {
  return `${arg} John`;
}

function addLastName(arg) {
  return `${arg} Doe.`;
}

sequenceOf([addName, sequenceOf([addLastName])])('Hi');
// Hi John Doe.
```

### Multiple arguments

The first handler receives every argument you pass. Use `flow.next(...args)` to send several arguments downstream.

```js
import { createSequenceOf } from '@daisugi/daisugi';

const sequenceOf = createSequenceOf();

function fullName(first, last) {
  return `${first} ${last}.`;
}

sequenceOf([fullName])('John', 'Doe');
// John Doe.
```

### Decorators

Pass decorators to `createSequenceOf` to wrap every handler, at registration time. A decorator receives a handler and returns a new one.

```js
import { createSequenceOf } from '@daisugi/daisugi';

function decorator(handler) {
  return function (arg) {
    return `${handler(arg)}!`;
  };
}

const sequenceOf = createSequenceOf([decorator]);

function addName(arg) {
  return `${arg} John`;
}

function addLastName(arg) {
  return `${arg} Doe`;
}

sequenceOf([addName, addLastName])('Hi');
// Hi John! Doe!
```

[:top: Back to top](#-table-of-contents)

---

## 🔷 TypeScript Support

Daisugi is written in TypeScript and ships its own types. `DaisugiHandler<Args, Return>` and `sequenceOf<Args, Return>` let you pin the input and output types.

```ts
import {
  createSequenceOf,
  type DaisugiHandler,
} from '@daisugi/daisugi';

const sequenceOf = createSequenceOf();

const greet: DaisugiHandler<[string], string> = (name) =>
  `Hi ${name}.`;

const handler = sequenceOf<[string], string>([greet]);

handler('John'); // typed as string
```

[:top: Back to top](#-table-of-contents)

---

## 🎯 Goal

Daisugi keeps the core simple, and grows through the tools you add to it.

[:top: Back to top](#-table-of-contents)

---

## 🌲 Etymology

*Daisugi* (台杉) is a 14th-century Japanese forestry technique that prunes cedar trees to grow uniform, straight, knot-free lumber. Much like how Daisugi shapes your code into a clean pipeline.

More info: [Twitter](https://twitter.com/wrathofgnon/status/1250287741247426565)

[:top: Back to top](#-table-of-contents)

---

## 🌍 Other Projects

[Meet the ecosystem](../../README.md)

[:top: Back to top](#-table-of-contents)

---

## 📜 License

[MIT](../../LICENSE)

[:top: Back to top](#-table-of-contents)
