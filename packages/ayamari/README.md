# @daisugi/ayamari

[![version](https://img.shields.io/npm/v/@daisugi/ayamari.svg)](https://www.npmjs.com/package/@daisugi/ayamari)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/ayamari)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/ayamari)](https://bundlephobia.com/result?p=@daisugi/ayamari)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Ayamari** helps you to create rich errors in a simple and consistent way.

---

## ✨ Features

- 💡 Minimal size overhead ([details](https://bundlephobia.com/result?p=@daisugi/ayamari))
- ⚡️ Written in TypeScript
- 📦 Uses only trusted dependencies
- 🔨 Powerful and agnostic to your code
- 🧪 Well-tested
- 🤝 Used in production
- 🔀 Supports both ES Modules and CommonJS

---

## 🚀 Usage

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

---

## 📖 Table of Contents

- [@daisugi/ayamari](#daisugiayamari)
  - [✨ Features](#-features)
  - [🚀 Usage](#-usage)
  - [📖 Table of Contents](#-table-of-contents)
  - [📦 Installation](#-installation)
  - [🔍 Overview](#-overview)
  - [🌍 Other Projects](#-other-projects)
  - [📜 License](#-license)

---

## 📦 Installation

Using npm:

```sh
npm install @daisugi/ayamari
```

Using pnpm:

```sh
pnpm install @daisugi/ayamari
```

[:top: Back to top](#table-of-contents)

---

## 🔍 Overview

**Ayamari** improves error handling by simplifying the creation of rich, contextual errors. It enhances the legibility of exception output and provides useful features such as:

- ✅ No stack generation by default (for performance)
- ✅ Chained causes
- ✅ Additional properties for extra context
- ✅ Custom errors
- ✅ Pretty stack traces
- ✅ Error levels for categorization

---

## 🌍 Other Projects

[Meet the ecosystem](../../README.md)

[:top: Back to top](#table-of-contents)

---

## 📜 License

[MIT](../../LICENSE)
