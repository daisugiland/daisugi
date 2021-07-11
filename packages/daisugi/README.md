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
