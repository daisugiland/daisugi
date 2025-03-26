# @daisugi/daisugi

<p align="center">
  <img alt="daisugi" src="https://user-images.githubusercontent.com/22574/125201112-fc787f00-e26d-11eb-8e70-569dbd6997e0.png" width="170">
</p>

<p align="center">
  Daisugi is a minimalist functional middleware engine.
</p>

[![version](https://img.shields.io/npm/v/@daisugi/daisugi.svg)](https://www.npmjs.com/package/@daisugi/daisugi)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

Well tested. | Without any external code dependencies and small size.

Daisugi was created with the purpose of organizing your code in an understandable execution pipeline.

---

## ✨ Features

- 💡 Minimal size overhead ([details](https://bundlephobia.com/result?p=@daisugi/daisugi))
- ⚡️ Written in TypeScript
- 📦 Uses only trusted dependencies
- 🔨 Powerful and agnostic to your code
- 🧪 Well-tested
- 🤝 Used in production
- 🔀 Supports both ES Modules and CommonJS

---

## 🚀 Usage

```js
import { Daisugi } from '@daisugi/daisugi';

const { sequenceOf } = new Daisugi();

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
  - [🔄 Downstream and Downstream/Upstream](#-downstream-and-downstreamupstream)
    - [Downstream](#downstream)
    - [Cascading (Downstream/Upstream)](#cascading-downstreamupstream)
  - [⏱ Synchronous and Asynchronous](#-synchronous-and-asynchronous)
  - [🏗 Nesting](#-nesting)
  - [🔄 Flow Control](#-flow-control)
    - [Example: Stopping Propagation](#example-stopping-propagation)
    - [Example: Failing with an Error](#example-failing-with-an-error)
  - [🔢 Multiple Arguments](#-multiple-arguments)
  - [🔧 Extendable](#-extendable)
  - [🎯 Goal](#-goal)
  - [📚 Etymology](#-etymology)
  - [🌍 Other Projects](#-other-projects)
  - [📜 License](#-license)

[:top: Back to top](#table-of-contents)

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

[:top: back to top](#table-of-contents)

---

## 🔄 Downstream and Downstream/Upstream

Daisugi allows both sequential execution (downstream) and cascading (downstream/upstream) flows.

### Downstream

Perform sequential executions like traditional pipes using simple functions (handlers).

```js
import { Daisugi } from '@daisugi/daisugi';

const { sequenceOf } = new Daisugi();

function addName(arg) {
  return `${arg} John.`;
}

sequenceOf([addName])('Hi');
// Hi John.
```

### Cascading (Downstream/Upstream)

Yield downstream and then flow control back upstream, often used in middleware (similar to [Koa](https://github.com/koajs/koa)). To achieve cascading, provide the `injectToolkit` property in the function's metadata (`meta`), which instructs Daisugi to include a toolkit with flow utilities (`next`, `nextWith`) as the last argument.

```js
import { Daisugi } from '@daisugi/daisugi';

const { sequenceOf } = new Daisugi();

function addName(arg, toolkit) {
  arg.value = `${arg.value} John`;
  return toolkit.next;
}

addName.meta = {
  injectToolkit: true,
};

function addLastName(arg) {
  return `${arg.value} Doe.`;
}

sequenceOf([addName])({ value: 'Hi' });
// 'Hi John.'
```

By default, the downstream type is used. You can switch to cascading for more complex behaviors (e.g., tracing, logging) or mix both types within the same sequence.

[:top: back to top](#table-of-contents)

---

## ⏱ Synchronous and Asynchronous

Daisugi supports both synchronous and asynchronous handlers.

```js
import { Daisugi } from '@daisugi/daisugi';

const { sequenceOf } = new Daisugi();

async function waitForName(arg, toolkit) {
  return await toolkit.next;
}

waitForName.meta = {
  injectToolkit: true,
};

async function addName(arg) {
  return `${arg} John.`;
}

await sequenceOf([waitForName, addName])('Hi');
// Hi John.
```

[:top: back to top](#table-of-contents)

---

## 🏗 Nesting

Daisugi allows you to nest sequences within each other as each sequence is simply another handler.

```js
import { Daisugi } from '@daisugi/daisugi';

const { sequenceOf } = new Daisugi();

function addName(arg) {
  return `${arg} John`;
}

function addLastName(arg) {
  return `${arg} Doe.`;
}

sequenceOf([addName, sequenceOf([addLastName])])('Hi');
// Hi John Doe.
```

[:top: back to top](#table-of-contents)

---

## 🔄 Flow Control

Daisugi gives you control over the data flow with static methods:

- `stopPropagationWith`: Stops and exits the current sequence.
- `failWith`: Stops execution and exits from all sequences.

### Example: Stopping Propagation

```js
import { Daisugi } from '@daisugi/daisugi';

const { sequenceOf } = new Daisugi();

function addName(arg) {
  return Daisugi.stopPropagationWith(`${arg} John.`);
}

function addLastName(arg) {
  return `${arg} Doe.`;
}

sequenceOf([addName, addLastName])('Hi');
// Hi John.
```

### Example: Failing with an Error

```js
import { Daisugi } from '@daisugi/daisugi';

const { sequenceOf } = new Daisugi();

function addName(arg) {
  return Daisugi.failWith(`${arg} John`);
}

function addLastName(arg) {
  return `${arg} Doe.`;
}

const response = sequenceOf([addName, addLastName])('Hi');
// response.getError().value === 'Hi John'
```

[:top: back to top](#table-of-contents)

---

## 🔢 Multiple Arguments

Handlers in Daisugi can receive multiple arguments, including `nextWith` among others.

```js
import { Daisugi } from '@daisugi/daisugi';

const { sequenceOf } = new Daisugi();

function addName(arg1, arg2, arg3) {
  return `${arg1} ${arg2} ${arg3}.`;
}

sequenceOf([addName])('Hi', 'John', 'Doe');
// Hi John Doe.
```

[:top: back to top](#table-of-contents)

---

## 🔧 Extendable

Daisugi allows you to extend handlers at execution time or during initialization using decorators.

```js
import { Daisugi } from '@daisugi/daisugi';

function decorator(handler) {
  return function addName(arg) {
    handler(`${arg} ${handler.meta.arg}`);
  };
}

const { sequenceOf } = new Daisugi([decorator]);

function addLastName(arg) {
  return `${arg} Doe.`;
}

addLastName.meta = {
  arg: 'John',
};

sequenceOf([addLastName])('Hi');
// Hi John Doe.
```

[:top: back to top](#table-of-contents)

---

## 🎯 Goal

Daisugi's goal is to keep the core simple while extending its functionality through provided tools.

[:top: back to top](#table-of-contents)

---

## 📚 Etymology

Daisugi is a Japanese forestry technique developed in the 14th century, where cedar trees are pruned to produce uniformly straight, knot-free lumber.

More info: [Twitter](https://twitter.com/wrathofgnon/status/1250287741247426565)

[:top: back to top](#table-of-contents)

---

## 🌍 Other Projects

[Meet the ecosystem](../../README.md)

[:top: back to top](#table-of-contents)

---

## 📜 License

[MIT](../../LICENSE)
