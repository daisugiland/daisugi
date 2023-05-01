# @daisugi/ayamari

[![version](https://img.shields.io/npm/v/@daisugi/ayamari.svg)](https://www.npmjs.com/package/@daisugi/ayamari)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/ayamari)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/ayamari)](https://bundlephobia.com/result?p=@daisugi/ayamari)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Ayamari** helps you to create rich errors in a simple and consistent way.

## 🌟 Features

- 💡 Minimum size [overhead](https://bundlephobia.com/result?p=@daisugi/ayamari).
- ⚡️ Written in TypeScript.
- 📦 Only uses trusted dependencies.
- 🔨 Powerful and agnostic to your code.
- 🧪 Well tested.
- 🤝 Is used in production.
- ⚡️ Exports ES Modules as well as CommonJS.

## Usage

```js
import { Ayamari } from '@daisugi/ayamari';

const { errFn } = new Ayamari();

try {
  eval('{');
} catch (err) {
  errFn.UnexpectedError('Something went wrong.', {
    cause: err,
  });
}
```

## Table of contents

- [@daisugi/ayamari](#daisugiayamari)
  - [🌟 Features](#-features)
  - [Usage](#usage)
  - [Table of contents](#table-of-contents)
  - [Install](#install)
  - [Overview](#overview)
  - [Other projects](#other-projects)
  - [License](#license)

## Install

Using npm:

```sh
npm install @daisugi/ayamari
```

Using yarn:

```sh
yarn add @daisugi/ayamari
```

[:top: back to top](#table-of-contents)

## Overview

**Ayamari** improves error handling for developers by simplifying the process and making it more manageable. It achieves this by enhancing the legibility of exception output and providing contextual rich errors with causes. The library includes several useful features:

- ✅ By default, `no stack` is generated for performance improvement.
- ✅ Chains of causes.
- ✅ Properties to provide extra information about the error.
- ✅ Custom errors.
- ✅ Pretty stack traces.
- ✅ Levels for categorizing errors.

## Other projects

[Meet the ecosystem](../../README.md)

[:top: back to top](#table-of-contents)

## License

[MIT](../../LICENSE)
