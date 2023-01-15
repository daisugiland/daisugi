# @daisugi/anzen

[![version](https://img.shields.io/npm/v/@daisugi/anzen.svg)](https://www.npmjs.com/package/@daisugi/anzen)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/anzen)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/anzen)](https://bundlephobia.com/result?p=@daisugi/anzen)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Anzen** helps write safe code without exceptions, taking roots from Rust's Result and Haskell's Either.

## 🌟 Features

- 💡 Minimum size [overhead](https://bundlephobia.com/result?p=@daisugi/anzen).
- ⚡️ Written in TypeScript.
- 📦 Only uses trusted dependencies.
- 🔨 Powerful and agnostic to your code.
- 🧪 Well tested.
- 🤝 Is used in production.
- ⚡️ Exports ES Modules as well as CommonJS.

## Usage

```js
import { Result } from '@daisugi/anzen';
import { readFileSync } from 'node:fs';

function readFile(path) {
  try {
    const response = readFileSync(path);
    return Result.success(response);
  } catch (err) {
    return Result.failure(err);
  }
}

// This line may fail unexpectedly without warnings,
const text = readFile('test.txt');

if (text.isFailure) {
  return text.getError();
}

return text.getValue();
```

## Table of contents

- [@daisugi/anzen](#daisugianzen)
  - [🌟 Features](#-features)
  - [Usage](#usage)
  - [Table of contents](#table-of-contents)
  - [Install](#install)
  - [Other projects](#other-projects)
  - [License](#license)

## Install

Using npm:

```sh
npm install @daisugi/anzen
```

Using yarn:

```sh
yarn add @daisugi/anzen
```

[:top: back to top](#table-of-contents)

## Other projects

[Meet the ecosystem](../../README.md)

[:top: back to top](#table-of-contents)

## License

[MIT](../../LICENSE)
