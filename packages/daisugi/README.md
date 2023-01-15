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

## Usage

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
// -> Hi John Doe.
```

## Table of contents

- [@daisugi/daisugi](#daisugidaisugi)
  - [Usage](#usage)
  - [Table of contents](#table-of-contents)
  - [Install](#install)
  - [Downstream and downstream/upstream](#downstream-and-downstreamupstream)
  - [Synchronous and asynchronous](#synchronous-and-asynchronous)
  - [Nesting](#nesting)
  - [Flow control](#flow-control)
  - [Multiple arguments](#multiple-arguments)
  - [Extendable](#extendable)
  - [Goal](#goal)
  - [Etymology](#etymology)
  - [Other projects](#other-projects)
  - [License](#license)

## Install

Using npm:

```sh
npm install @daisugi/daisugi
```

Using yarn:

```sh
yarn add @daisugi/daisugi
```

[:top: back to top](#table-of-contents)

## Downstream and downstream/upstream

Daisugi allows both types, perform sequential executions like traditional pipes do, by `downstream`, to accomplish it you need to use simple functions (`handlers`).

```js
import { Daisugi } from '@daisugi/daisugi';

const { sequenceOf } = new Daisugi();

function addName(arg) {
  return `${arg} John.`;
}

sequenceOf([addName])('Hi');
// -> Hi John.
```

Or by yielding `downstream`, then flowing the control back `upstream`, often used in middleware (like [Koa](https://github.com/koajs/koa) does). This effect is called cascading. To get it, you only need to provide the `injectToolkit` property to the `meta` data of the function, that tells to Daisugi include the `toolkit` with flow utilities (`next`, `nextWith`) as the last argument to your function.

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
// -> 'Hi John.'
```

By default the type used is `downstream`, its use is more common. But you can always switch to cascading to get more complex behavior (tracing, logger ...). Or you can mix the both types in the same sequence.

[:top: back to top](#table-of-contents)

## Synchronous and asynchronous

Daisugi allows `handlers` to be synchronous or asynchronous.

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
// -> Hi John.
```

[:top: back to top](#table-of-contents)

## Nesting

Daisugi allows you to nest as many sequences within each other as needed, because each sequence is nothing more than a new `handler`.

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
// -> Hi John Doe.
```

[:top: back to top](#table-of-contents)

## Flow control

In Daisugi you are the owner of the data flow, for that purpose you have available a few static methods:

- `stopPropagationWith`, gives you the possibility to stop and exit the execution of the current sequence.
- `failWith`, stops the execution and exits from all sequences.

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
// -> Hi John.
```

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
// -> response.getError().value === 'Hi John'.
```

[:top: back to top](#table-of-contents)

## Multiple arguments

The title speaks for itself, you can provide to the `handlers`, `nextWith` among others, much arguments as needed.

```js
import { Daisugi } from '@daisugi/daisugi';

const { sequenceOf } = new Daisugi();

function addName(arg1, arg2, arg3) {
  return `${arg} ${arg2} ${arg3}.`;
}

sequenceOf([addName])('Hi', 'John', 'Doe');
// -> Hi John Doe.
```

[:top: back to top](#table-of-contents)

## Extendable

Daisugi gives you the freedom to extend any `handler` at execution time or during initialization, using the decorators.

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
// -> Hi John Doe.
```

[:top: back to top](#table-of-contents)

## Goal

Daisugi goal is to keep the core as simple as possible, and extend its functionality through the provided tools.

[:top: back to top](#table-of-contents)

## Etymology

Daisugi is a Japanese forestry technique, originated in the 14th century, where specially planted cedar trees are pruned heavily to produce "shoots" that become perfectly uniform, straight and completely knot free lumber.

More info: https://twitter.com/wrathofgnon/status/1250287741247426565

[:top: back to top](#table-of-contents)

## Other projects

[Meet the ecosystem](../../README.md)

[:top: back to top](#table-of-contents)

## License

[MIT](../../LICENSE)
