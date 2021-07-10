# @daisugi/daisugi

> Daisugi is a minimalist functional middleware engine.

## Install

Using npm:

```sh
npm install @daisugi/daisugi
```

Using yarn:

```sh
yarn add @daisugi/daisugi
```

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
