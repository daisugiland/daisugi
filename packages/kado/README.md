# @daisugi/kado

[![version](https://img.shields.io/npm/v/@daisugi/kado.svg)](https://www.npmjs.com/package/@daisugi/kado)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/kado)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/kado)](https://bundlephobia.com/result?p=@daisugi/kado)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Kado** is a minimal and unobtrusive inversion of control container.

## 🌟 Features

- 💡 Minimum size [overhead](https://bundlephobia.com/result?p=@daisugi/kado).
- ⚡️ Written in TypeScript.
- 📦 Only uses trusted dependencies.
- 🔨 Powerful and agnostic to your code.
- 🧪 Well tested.
- 🤝 Is used in production.
- ⚡️ Exports ES Modules as well as CommonJS.

## Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

class Foo {
  constructor(bar) {
    this.bar = bar;
  }
}

class Bar {}

container.register([
  {
    token: 'Foo',
    useClass: Foo,
    params: ['Bar'],
  },
  {
    token: 'Bar',
    useClass: Bar,
  },
]);

const foo = container.resolve('Foo');
```

## Table of contents

- [@daisugi/kado](#daisugikado)
  - [🌟 Features](#-features)
  - [Usage](#usage)
  - [Table of contents](#table-of-contents)
  - [Install](#install)
  - [Motivation](#motivation)
  - [API](#api)
    - [#register(manifestItems)](#registermanifestitems)
      - [Usage](#usage-1)
    - [#resolve(token)](#resolvetoken)
      - [Usage](#usage-2)
    - [#get(token)](#gettoken)
      - [Usage](#usage-3)
    - [token](#token)
    - [useClass](#useclass)
      - [Usage](#usage-4)
    - [useValue](#usevalue)
      - [Usage](#usage-5)
    - [useFactoryByContainer](#usefactorybycontainer)
      - [Usage](#usage-6)
    - [useFactory](#usefactory)
      - [Usage](#usage-7)
    - [scope](#scope)
      - [Usage](#usage-8)
    - [meta](#meta)
      - [Usage](#usage-9)
    - [params](#params)
      - [Usage](#usage-10)
    - [#list()](#list)
      - [Usage](#usage-11)
    - [Kado.value](#kadovalue)
      - [Usage](#usage-12)
    - [Kado.map](#kadomap)
      - [Usage](#usage-13)
    - [Kado.flatMap](#kadoflatmap)
      - [Usage](#usage-14)
  - [TypeScript](#typescript)
  - [Goal](#goal)
  - [Etymology](#etymology)
  - [Other projects](#other-projects)
  - [License](#license)

## Install

Using npm:

```sh
npm install @daisugi/kado
```

Using yarn:

```sh
yarn add @daisugi/kado
```

[:top: back to top](#table-of-contents)

## Motivation

This library is a result of a series of the requirements that either were not met by other libraries of same type, or were partially met, or finally met everything but also brought an overhead not required by the project.

If you feel that any of the following requirements is close to your demand, feel free to use this library, otherwise there are many other good IoC libraries out there such as [di-ninja](https://github.com/di-ninja/di-ninja) or [tsyringe](https://github.com/microsoft/tsyringe), among many others that you can use.

- ✔️ Should allow to create multiple instances of the container, and not share the state globally (useful when multiple packages are using it, or for monorepo).
- ✔️ The DI configuration must be abstracted from the base code, and must be able to be easily ported (Composition Root).
- ✔️ Dependencies must be able easily decorated (useful to add telemetry, debug ...).
- ✔️ Avoid use of decorators by annotations (see [style guide](https://github.com/daisugiland/javascript-style-guide)).
- ✔️ Should work with pure JavaScript (don't depend of any superset like TypeScript).
- ✔️ Keep the API simple (singleton and not, classes, values, factories, and not much more), but with enough pieces to cover the most common use cases.

[:top: back to top](#table-of-contents)

## API

### #register(manifestItems)

Used for registration of `manifest items` in the `container`.

#### Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

container.register([{ token: 'Foo' }]);
```

[:top: back to top](#table-of-contents)

### #resolve(token)

Use this method when you need to resolve the registered dependency.

#### Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

container.register([{ token: 'Foo' }]);

const foo = container.resolve('Foo');
```

[:top: back to top](#table-of-contents)

### #get(token)

Returns registered `manifest item` by `token`.

#### Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

class Foo {}

container.register([
  {
    token: 'Foo',
    useClass: Foo,
    scope: 'Transient',
  },
]);

const manifestItem = container.get('Foo');
```

[:top: back to top](#table-of-contents)

### token

Is the name used to register the dependency, to later be resolved.

[:top: back to top](#table-of-contents)

### useClass

Can go along with `params` property, which contains `tokens` with which the class should be resolved.

#### Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

class Foo {
  constructor(bar) {
    this.bar = bar;
  }
}

class Bar {}

container.register([
  {
    token: 'Foo',
    useClass: Foo,
    params: ['Bar'],
  },
  {
    token: 'Bar',
    useClass: Bar,
  },
]);

const foo = container.resolve('Foo');
```

[:top: back to top](#table-of-contents)

### useValue

Useful for storing constants.

#### Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

container.register([
  {
    token: 'foo',
    useValue: 'text',
  },
]);

const foo = container.resolve('foo');
```

[:top: back to top](#table-of-contents)

### useFactoryByContainer

Provides `container` as argument to the factory method.

#### Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

class Foo {}

function bar(c) {
  return c.resolve('Foo');
}

container.register([
  {
    token: 'Foo',
    useClass: Foo,
  },
  {
    token: 'bar',
    useFactoryByContainer: bar,
  },
]);

const foo = container.resolve('bar');
```

[:top: back to top](#table-of-contents)

### useFactory

Same as `useFactoryByContainer`, except provides `params` to it, instead of the `container`.

#### Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

class Foo {}

function bar(foo) {
  return foo;
}

container.register([
  {
    token: 'Foo',
    useClass: Foo,
  },
  {
    token: 'bar',
    useFactory: bar,
    params: ['Foo'],
  },
]);

const foo = container.resolve('bar');
```

[:top: back to top](#table-of-contents)

### scope

Scope can be `Transient` or `Singleton`, by default it's `Singleton`. Can be used along with `useClass`, `useFactoryByContainer` and `useFactory`. Having scope as `Transient` it will create a new instance every time the dependency is resolved, `Singleton` will reuse the already created instance.

#### Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

class Foo {}

container.register([
  {
    token: 'Foo',
    useClass: Foo,
    scope: 'Transient',
  },
]);

const foo = container.resolve('Foo');
```

[:top: back to top](#table-of-contents)

### meta

Can be used to store arbitrary values.

#### Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

class Foo {}

container.register([
  {
    token: 'Foo',
    meta: {
      isFoo: true,
    }
  },
]);

const foo = container.get('Foo');
foo.meta.isFoo; // -> true
```

[:top: back to top](#table-of-contents)

### params

As can be observed in the previous examples the `params` key can receive an array of `tokens`, but also you can provide `manifest items`, you have an example below where we are injecting a text to the `Foo` class. Also for the convenience `Kado` provides some helpers [Kado.value](#kadovalue), [Kado.map](#kadomap) and [Kado.flatMap](#kadoflatmap), behind the scene these helpers are returning a simple `manifest items`.

#### Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

class Foo {
  constructor(bar) {
    this.bar = bar;
  }
}

container.register([
  {
    token: 'Foo',
    useClass: Foo,
    param: [{
      useValue: 'text',
    }],
  },
]);

const foo = container.resolve('Foo');

foo.bar; // -> 'text'
```

[:top: back to top](#table-of-contents)

### #list()

Get the list of the registered dependencies.

#### Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

class Foo {}

container.register([
  {
    token: 'Foo',
    useClass: Foo,
    scope: 'Transient',
  },
]);

const manifestItems = container.list();

// Now you can iterate over the manifest items and decorate them.
```

[:top: back to top](#table-of-contents)

### Kado.value

Useful when you want to inject a value.

#### Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

class Foo {
  constructor(bar) {
    this.bar = bar;
  }
}

container.register([
  {
    token: 'Foo',
    useClass: Foo,
    param: [Kado.value('text')],
  },
]);

const foo = container.resolve('Foo');

foo.bar; // -> 'text'
```

[:top: back to top](#table-of-contents)

### Kado.map

Useful when you want to resolve an array of items.

#### Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

class Foo {
  constructor(args) {
    this.bar = args[0];
  }
}

container.register([
  {
    token: 'bar',
    useValue: 'text',
  },
  {
    token: 'Foo',
    useClass: Foo,
    param: [Kado.map(['bar'])],
  },
]);

const foo = container.resolve('Foo');

foo.bar; // -> 'text'
```

[:top: back to top](#table-of-contents)

### Kado.flatMap

The same as `Kado.map` but also it flats the array result.

#### Usage

```js
import { Kado } from '@daisugi/kado';

const { container } = new Kado();

class Foo {
  constructor(args) {
    this.bar = args[0];
  }
}

container.register([
  {
    token: 'bar',
    useValue: ['text'],
  },
  {
    token: 'Foo',
    useClass: Foo,
    param: [Kado.flatMap(['bar'])],
  },
]);

const foo = container.resolve('Foo');

foo.bar; // -> 'text'
```

[:top: back to top](#table-of-contents)

## TypeScript

The Kado is fully written in TypeScript, therefore you have available some types.

```ts
import {
  Kado,
  ManifestItem,
  Container,
  Token,
  Scope,
} from '@daisugi/kado';

const { container } = new Kado();

class Foo {}

const myContainer: Container = container;
const token: Token = 'Foo';
const scope: Scope = Kado.scope.Transient;
const manifestItems: ManifestItem[] = [
  {
    token,
    useClass: Foo,
    scope,
  }
];

myContainer.register(manifestItems);

const foo = myContainer.resolve<Foo>('Foo');
```

[:top: back to top](#table-of-contents)

## Goal

The project aims to provide the basic functionality for IoC. The functionality will be kept simple and will not be overextended.

[:top: back to top](#table-of-contents)

## Etymology

Kado is a Japanese art that involves an arrangement of a variety of plants. A characteristic of Japanese Kado is an emphasis on shapes and lines, as well as the manner in which the flower is placed into the dish.

[:top: back to top](#table-of-contents)

## Other projects

| Project                                                                         | Version                                                                                                           | Changelog                             | Description                                                                                     |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [Daisugi](../daisugi)                                                           | [![version](https://img.shields.io/npm/v/@daisugi/daisugi.svg)](https://www.npmjs.com/package/@daisugi/daisugi)   | [changelog](../daisugi/CHANGELOG.md)  | Is a minimalist functional middleware engine.                                                   |
| [Kintsugi](../kintsugi)                                                         | [![version](https://img.shields.io/npm/v/@daisugi/kintsugi.svg)](https://www.npmjs.com/package/@daisugi/kintsugi) | [changelog](../kintsugi/CHANGELOG.md) | Is a set of utilities to help build a fault tolerant services.                                  |
| [Anzen](../anzen)                                                               | [![version](https://img.shields.io/npm/v/@daisugi/anzen.svg)](https://www.npmjs.com/package/@daisugi/anzen)       | [changelog](../anzen/CHANGELOG.md)    | Helps write safe code without exceptions, taking roots from Rust's Result and Haskell's Either. |
| [Nekobasu](../nekobasu)                                                         | [![version](https://img.shields.io/npm/v/@daisugi/nekobasu.svg)](https://www.npmjs.com/package/@daisugi/nekobasu) | [changelog](../nekobasu/CHANGELOG.md) | Is a lightweight, easy to use, asynchronous and efficient EventBus implementation.              |
| [Land](../land)                                                                 | [![version](https://img.shields.io/npm/v/@daisugi/land.svg)](https://www.npmjs.com/package/@daisugi/land)         | [changelog](../land/CHANGELOG.md)     | Is an aggregation of tools for building composable applications.                                |
| [JavaScript style guide](https://github.com/daisugiland/javascript-style-guide) |                                                                                                                   |                                       |                                                                                                 |

[:top: back to top](#table-of-contents)

## License

[MIT](../../LICENSE)
