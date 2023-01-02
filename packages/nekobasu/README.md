# @daisugi/nekobasu

[![version](https://img.shields.io/npm/v/@daisugi/nekobasu.svg)](https://www.npmjs.com/package/@daisugi/nekobasu)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/nekobasu)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/nekobasu)](https://bundlephobia.com/result?p=@daisugi/nekobasu)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Nekobasu** is a lightweight, easy to use, asynchronous and efficient EventBus implementation.

## 🌟 Features

- 💡 Minimum size [overhead](https://bundlephobia.com/result?p=@daisugi/nekobasu).
- ⚡️ Written in TypeScript.
- 📦 Only uses trusted dependencies.
- 🔨 Powerful and agnostic to your code.
- 🧪 Well tested.
- 🤝 Is used in production.
- ⚡️ Exports ES Modules as well as CommonJS.

## Usage

```js
import { Nekobasu } from '@daisugi/nekobasu';

const nekobasu = new Nekobasu();
nekobasu.subscribe('foo.*', (event) => {
  console.log(event);
});
nekobasu.dispatch('foo.bar');
```

## Table of contents

- [@daisugi/nekobasu](#daisuginekobasu)
  - [🌟 Features](#-features)
  - [Usage](#usage)
  - [Table of contents](#table-of-contents)
  - [Install](#install)
  - [Other projects](#other-projects)
  - [License](#license)

## Install

Using npm:

```sh
npm install @daisugi/nekobasu
```

Using yarn:

```sh
yarn add @daisugi/nekobasu
```

[:top: back to top](#table-of-contents)

## Other projects

[Meet the ecosystem](../../README.md)

[:top: back to top](#table-of-contents)

## License

[MIT](../../LICENSE)
