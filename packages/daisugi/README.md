# @daisugi/daisugi

<p align="center">
  <img alt="daisugi" src="https://user-images.githubusercontent.com/22574/125201112-fc787f00-e26d-11eb-8e70-569dbd6997e0.png" width="170">
</p>

<p align="center">
  Daisugi is a minimalist functional middleware engine.
</p>

Daisugi was created with the purpose of organizing your code in an understandable execution pipeline.

## Usage

```javascript
const { daisugi } = require('@daisugi/daisugi');

const { sequenceOf } = daisugi();

function addName(arg) {
  return `${arg} Benadryl`;
}

function addLastName(arg) {
  return `${arg} Cumberbatch.`;
}

const handler = sequenceOf([addName, addLastName]);

handler('Hi');
// -> Hi Benadryl Cumberbatch.
```

- [@daisugi/daisugi](#-daisugi-daisugi)
  - [Usage](#usage)
  - [Install](#install)
  - [Downstream and downstream/upstream](#downstream-and-downstream-upstream)
  - [Synchronous and asynchronous](#synchronous-and-asynchronous)
  - [Nesting](#nesting)
  - [Flow control](#flow-control)
  - [Multiple arguments](#multiple-arguments)
  - [Extendable](#extendable)
  - [Goal](#goal)
  - [FAQ](#faq)
    - [Where does the name come from?](#where-does-the-name-come-from-)
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

## Downstream and downstream/upstream

Daisugi allows both types, perform sequential executions like traditional pipes do, by `downstream`, to accomplish it you need to use simple functions (`handlers`).

```javascript
const { daisugi } = require('@daisugi/daisugi');

const { sequenceOf } = daisugi();

function addName(arg) {
  return `${arg} Benadryl.`;
}

sequenceOf([addName])('Hi');
// -> Hi Benadryl.
```

Or by yielding `downstream`, then flowing the control back `upstream`, often used in middleware (like Koa does). This effect is called cascading. To get it, you only need to provide the `injectToolkit` property to the `meta` data of the function, that tells to Daisugi include the `toolkit` with flow utilities (`next`, `nextWith`) as the last argument to your function.

```javascript
const { daisugi } = require('@daisugi/daisugi');

const { sequenceOf } = daisugi();

function addName(arg, toolkit) {
  arg.value = `${arg.value} Benadryl`;

  return toolkit.next;
}

addName.meta = {
  injectToolkit: true,
};

function addLastName(arg) {
  return `${arg.value} Cumberbatch.`;
}

sequenceOf([addName])({ value: 'Hi' });
// -> 'Hi Benadryl.'
```

By default the type used is `downstream`, its use is more common. But you can always switch to cascading to get more complex behavior (tracing, logger ...). Or you can mix the both types in the same sequence.

## Synchronous and asynchronous

Daisugi allows `handlers` to be synchronous or asynchronous.

```javascript
const { daisugi } = require('@daisugi/daisugi');

const { sequenceOf } = daisugi();

async function addName(arg, toolkit) {
  return await toolkit.next;
}

addName.meta = {
  injectToolkit: true,
};

async function addName(arg) {
  return `${arg} Benadryl.`;
}

(async () => {
  await sequenceOf([addName])('Hi');
  // -> Hi Benadryl.
})();
```

## Nesting

Daisugi allows you to nest as many sequences within each other as needed, because each sequence is nothing more than a new `handler`.

```javascript
const { daisugi } = require('@daisugi/daisugi');

const { sequenceOf } = daisugi();

function addName(arg) {
  return `${arg} Benadryl`;
}

function addLastName(arg) {
  return `${arg} Cumberbatch.`;
}

sequenceOf([addName, sequenceOf([addLastName])])('Hi');
// -> Hi Benadryl Cumberbatch.
```

## Flow control

In Daisugi you are the owner of the data flow, for that purpose you have available a few methods:

- `stopPropagationWith`, gives you the possibility to stop and exit the execution of the current sequence.
- `failWith`, stops the execution and exits from all sequences.

```javascript
const {
  daisugi,
  stopPropagationWith,
} = require('@daisugi/daisugi');

const { sequenceOf } = daisugi();

function addName(arg) {
  return stopPropagationWith(`${arg} Benadryl.`);
}

function addLastName(arg) {
  return `${arg} Cumberbatch.`;
}

sequenceOf([addName, addLastName])('Hi');
// -> Hi Benadryl.
```

```javascript
const { daisugi, failWith } = require('@daisugi/daisugi');

const { sequenceOf } = daisugi();

function addName(arg) {
  return failWith(`${arg} Benadryl`);
}

function addLastName(arg) {
  return `${arg} Cumberbatch.`;
}

sequenceOf([addName, addLastName])('Hi');
// -> Result.error.value<'Hi Benadryl'>.
```

## Multiple arguments

The title speaks for itself, you can provide to the `handlers`, `nextWith` among others, much arguments as needed.

```javascript
const { daisugi } = require('@daisugi/daisugi');

const { sequenceOf } = daisugi();

function addName(arg1, arg2, arg3) {
  return `${arg} ${arg2} ${arg3}.`;
}

sequenceOf([addName])('Hi', 'Benadryl', 'Cumberbatch');
// -> Hi Benadryl Cumberbatch.
```

## Extendable

Daisugi gives you the freedom to extend any `handler` at execution time or during initialization, using the decorators.

```javascript
const { daisugi } = require('@daisugi/daisugi');

function decorator(handler) {
  return function addName(arg) {
    handler(`${arg} ${handler.meta.arg}`);
  };
}

const { sequenceOf } = daisugi([decorator]);

function addLastName(arg) {
  return `${arg} Cumberbatch.`;
}

addLastName.meta = {
  arg: 'Benadryl',
};

sequenceOf([addLastName])('Hi');
// -> Hi Benadryl Cumberbatch.
```

## Goal

Daisugi goal is to keep the core as simple as possible, and extend its functionality through the provided tools.

## FAQ

### Where does the name come from?

Daisugi is a Japanese forestry technique, originated in the 14th century, where specially planted cedar trees are pruned heavily to produce "shoots" that become perfectly uniform, straight and completely knot free lumber.

More info: https://twitter.com/wrathofgnon/status/1250287741247426565

## License

[MIT](../../LICENSE)
