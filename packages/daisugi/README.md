# @daisugi/daisugi

<p align="center">
  <img alt="daisugi" src="https://user-images.githubusercontent.com/22574/125201112-fc787f00-e26d-11eb-8e70-569dbd6997e0.png" width="170">
</p>

<p align="center">
  Daisugi is a minimalist functional middleware engine.
</p>

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

## Install

Using npm:

```sh
npm install @daisugi/daisugi
```

Using yarn:

```sh
yarn add @daisugi/daisugi
```

## Downstream

```javascript
const { daisugi } = require('@daisugi/daisugi');

const { sequenceOf } = daisugi();

function addName(arg) {
  return `${arg} Benadryl.`;
}

sequenceOf([addName])('Hi');
// -> Hi Benadryl.
```

## stopPropagationWith()

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

## Nested sequences

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

## Multiple arguments

```javascript
const { daisugi } = require('@daisugi/daisugi');

const { sequenceOf } = daisugi();

function addName(arg1, arg2, arg3) {
  return `${arg} ${arg2} ${arg3}.`;
}

sequenceOf([addName])('Hi', 'Benadryl', 'Cumberbatch');
// -> Hi Benadryl Cumberbatch.
```

## failWith()

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

## async/await

```javascript
const { daisugi } = require('@daisugi/daisugi');

const { sequenceOf } = daisugi();

async function addName(arg) {
  return `${arg} Benadryl.`;
}

(async () => {
  await sequenceOf([addName])('Hi');
  // -> Hi Benadryl.
})();
```

## Downstream/Upstream

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

## toolkit.nextWith()

```javascript
const { daisugi } = require('@daisugi/daisugi');

const { sequenceOf } = daisugi();

function addName(arg, toolkit) {
  return toolkit.nextWith(`${arg} Benadryl`);
}

addName.meta = {
  injectToolkit: true,
};

function addLastName(arg) {
  return `${arg} Cumberbatch.`;
}

sequenceOf([addName, addLastName])('Hi');
// -> Hi Benadryl Cumberbatch.
```

## async/await

```javascript
const { daisugi } = require('@daisugi/daisugi');

const { sequenceOf } = daisugi();

async function addName(arg, toolkit) {
  return await toolkit.next;
}

addName.meta = {
  injectToolkit: true,
};
```

## Decorators

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
