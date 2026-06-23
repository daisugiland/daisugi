<p align="center">
  <img alt="daisugi" src="https://user-images.githubusercontent.com/22574/125201112-fc787f00-e26d-11eb-8e70-569dbd6997e0.png" width="170">
</p>

<h1 align="center">Daisugi</h1>

<p align="center">
  <strong>A garden of small, composable TypeScript libraries for building robust applications.</strong>
</p>

<p align="center">
  Pick one. Pick all of them. Each package does one thing well, ships zero (or trusted) dependencies, runs everywhere JavaScript runs, and is designed to compose with the others.
</p>

<p align="center">
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6.svg?logo=typescript&logoColor=white">
  <img alt="Node" src="https://img.shields.io/badge/node-%3E%3D22.13.1-43853d.svg?logo=node.js&logoColor=white">
  <img alt="Modules: ESM + CJS" src="https://img.shields.io/badge/modules-ESM%20%2B%20CJS-f7df1e.svg">
  <a href="#-contributing"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg"></a>
</p>

---

## 🌱 Why Daisugi?

Most "frameworks" ask you to adopt everything at once. Daisugi takes the opposite approach, inspired by the Japanese forestry technique it is named after: grow many straight, independent shoots from a single healthy base.

- **🧩 Composable, not monolithic** - Every package is independently published and versioned. Install only what you need; reach for the next one when you need it.
- **🪶 Tiny and dependency-light** - Minimal bundle footprint, zero or only trusted dependencies. Tree-shakeable down to the functions you actually import.
- **🌐 Universal** - Runs in the browser and on the server (Node.js). Distributed as **ESM (ES2025)** _and_ **CommonJS**, with full TypeScript typings.
- **🔬 Type-safe by design** - Errors live in your function signatures (not in `try/catch` you forgot to write), dependencies are wired explicitly, and the compiler is on your side.
- **🤝 Production-tested** - Used in production, some packages serving millions of users.

---

## 📦 What's Inside

This is a monorepo of six independently versioned packages:

| Package                             | Version                                                                                                           | Description                                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **[Daisugi](./packages/daisugi)**   | [![version](https://img.shields.io/npm/v/@daisugi/daisugi.svg)](https://www.npmjs.com/package/@daisugi/daisugi)   | A minimalist, functional middleware engine - organize code into clear execution pipelines.           |
| **[Kado](./packages/kado)**         | [![version](https://img.shields.io/npm/v/@daisugi/kado.svg)](https://www.npmjs.com/package/@daisugi/kado)         | A lightweight, unobtrusive inversion of control (IoC) container for wiring dependencies.             |
| **[Anzen](./packages/anzen)**       | [![version](https://img.shields.io/npm/v/@daisugi/anzen.svg)](https://www.npmjs.com/package/@daisugi/anzen)       | A `Result` type for safe error handling without exceptions, inspired by Rust and Haskell.            |
| **[Ayamari](./packages/ayamari)**   | [![version](https://img.shields.io/npm/v/@daisugi/ayamari.svg)](https://www.npmjs.com/package/@daisugi/ayamari)   | A factory for rich, structured errors with error codes, chained causes, and prettified stack traces. |
| **[Kintsugi](./packages/kintsugi)** | [![version](https://img.shields.io/npm/v/@daisugi/kintsugi.svg)](https://www.npmjs.com/package/@daisugi/kintsugi) | Resilience utilities - retries, timeouts, caching, and pooling for fault-tolerant services.          |
| **[Land](./packages/land)**         | [![version](https://img.shields.io/npm/v/@daisugi/land.svg)](https://www.npmjs.com/package/@daisugi/land)         | A single package that bundles the entire @daisugi toolkit in one install.                            |

> Each package has its own README with a full API reference, motivation, and examples - click any name above.

---

## 🚀 Quick Taste

Each package stands on its own:

```ts
// Daisugi - compose functions into a pipeline
import { Daisugi } from '@daisugi/daisugi';
const { sequenceOf } = new Daisugi();
const greet = sequenceOf([(s) => `${s} John`, (s) => `${s} Doe.`]);
greet('Hi'); // "Hi John Doe."
```

```ts
// Anzen - make failure a value, not a surprise
import { ok, err } from '@daisugi/anzen';
const parse = (n: string) =>
  Number.isNaN(+n) ? err('not a number') : ok(+n);
parse('42').unwrap(); // 42
```

```ts
// Kado - wire dependencies without the boilerplate
import { Kado } from '@daisugi/kado';
const { container } = new Kado();
container.register([
  { token: 'Foo', useClass: Foo, params: ['Bar'] },
  { token: 'Bar', useClass: Bar },
]);
const foo = await container.resolve('Foo');
```

```ts
// Kintsugi - wrap a flaky call in resilience
import { withCache, withRetry, reusePromise } from '@daisugi/kintsugi';
const rockSolid = withCache(withRetry(reusePromise(fetchUser)));
```

```ts
// Ayamari - errors with codes, causes, and pretty stacks
import { Ayamari, formatStack } from '@daisugi/ayamari';
const { errs } = new Ayamari();
throw errs.NotFound('User missing', { cause: dbErr });
```

---

## 🌳 The Ecosystem in Action

The real payoff is composition. Here every package pulls its weight in a single flow - resilient I/O, explicit errors, dependency wiring, and a readable pipeline:

```ts
// One install, one import - Land re-exports the entire toolkit.
import {
  Daisugi,
  Kado,
  ok,
  Ayamari,
  withRetry,
  withTimeout,
  type AnzenResult,
  type AyamariErr,
} from '@daisugi/land';

const { errs, errsResult } = new Ayamari();

// A flaky dependency, hardened with Kintsugi and returning an Anzen Result.
const fetchUser = withRetry(
  withTimeout(async (id: string): Promise<AnzenResult<AyamariErr, User>> => {
    const res = await api.getUser(id);
    return res ? ok(res) : errsResult.NotFound(`No user ${id}`);
  }),
);

// Wire collaborators with Kado, sharing Ayamari's error factory.
const { container } = new Kado({ errs });
container.register([{ token: 'Greeter', useClass: Greeter }]);

// Orchestrate the steps as a Daisugi pipeline.
const { sequenceOf } = new Daisugi();
const handle = sequenceOf([
  async (id: string) => (await fetchUser(id)).unwrap(),
  async (user: User) => (await container.resolve('Greeter')).welcome(user),
]);

await handle('u_123');
```

No magic, no globals - just small pieces that fit together. See [`@daisugi/anzen`](./packages/anzen#-composition-styles-side-by-side) for a deeper, real-world checkout example.

---

## 📥 Installation

Install just the package you need:

```sh
npm install @daisugi/anzen
# or
pnpm install @daisugi/kintsugi
```

Or grab the whole toolkit in one go with **[Land](./packages/land)**:

```sh
pnpm install @daisugi/land
```

```ts
import { Daisugi, Kado, Ayamari, ok, err } from '@daisugi/land';
```

---

## 🛠️ Development

```sh
# Install dependencies for every package
pnpm install

# Build all packages
pnpm build

# Run the full test suite
pnpm test

# Lint and format (oxlint + oxfmt)
pnpm lint
pnpm format
```

Each package can also be built and tested in isolation from its own directory (`pnpm --filter @daisugi/anzen test`).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

Found a bug or have an idea? [Open an issue](https://github.com/daisugiland/daisugi/issues).

---

## 📜 License

[MIT](./LICENSE) © Daisugi contributors
