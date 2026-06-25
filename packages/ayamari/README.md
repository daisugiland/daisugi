# @daisugi/ayamari

[![version](https://img.shields.io/npm/v/@daisugi/ayamari.svg)](https://www.npmjs.com/package/@daisugi/ayamari)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/ayamari)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/ayamari)](https://bundlephobia.com/result?p=@daisugi/ayamari)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Ayamari** builds rich, structured errors with error codes, chained causes, and pretty stack traces.

---

## ✨ Features

- 💡 Minimal size overhead ([details](https://bundlephobia.com/result?p=@daisugi/ayamari))
- ⚡️ Written in TypeScript
- 📦 Uses only trusted dependencies
- 🔨 Powerful and agnostic to your code
- 🧪 Well-tested
- 🤝 Used in production
- 🌳 Tree-shakeable
- 🌐 Universal - runs in the browser and on the server (Node.js)
- 🔀 Supports both ES Modules and CommonJS

---

## 🚀 Usage

Create an instance, then build errors from `errs`. Print them with `formatStack`.

```js
import { Ayamari, formatStack } from '@daisugi/ayamari';

const { errs } = new Ayamari();

try {
  eval('{');
} catch (err) {
  const appErr = errs.UnexpectedError('Something went wrong.', {
    cause: err,
  });

  console.error(formatStack(appErr, { color: true }));
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
  - [📚 API](#-api)
    - [`new Ayamari(opts?)`](#new-ayamariopts)
    - [`errs`](#errs)
    - [`errsResult`](#errsresult)
    - [`errCode`](#errcode)
    - [`level`](#level)
    - [`wrapErr` / `wrapErrResult`](#wrapErr--wrapErrResult)
    - [`formatStack`](#formatstack)
    - [`isAyamariErr`](#isayamarierr)
    - [`findCauseByCode`](#findcausebycode)
    - [Custom error codes](#custom-error-codes)
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

[:top: Back to top](#-table-of-contents)

---

## 🔍 Overview

Ayamari makes errors easy to create and easy to read. Every error carries a code, an optional cause, and any extra context you add.

It gives you:

- ✅ No stack generation by default (for performance)
- ✅ Chained causes
- ✅ Extra properties for context
- ✅ Custom error codes
- ✅ Pretty stack traces
- ✅ Errors that are `instanceof Error`
- ✅ Result-type integration via [@daisugi/anzen](../anzen)

[:top: Back to top](#-table-of-contents)

---

## 📚 API

### `new Ayamari(opts?)`

Creates an Ayamari instance.

| Option          | Type      | Default | Description                                                |
| --------------- | --------- | ------- | ---------------------------------------------------------- |
| `injectStack`   | `boolean` | `false` | Capture a real stack trace on each error (has a cost).     |
| `customErrCode` | `object`  | -       | Extra error codes to add (see [Custom error codes](#custom-error-codes)). |

```ts
const ayamari = new Ayamari({
  injectStack: true,
});
```

---

### `errs`

A map of error creators, one per code. Each has this signature:

```ts
errs.<Name>(message: string, opts?: AyamariErrOpts): AyamariErr
```

| Option        | Type                  | Default          | Description                          |
| ------------- | --------------------- | ---------------- | ------------------------------------ |
| `cause`       | `AyamariErr \| Error` | -                | The underlying error.                |
| `meta`        | `unknown`             | `null`           | Extra data attached to the error.    |
| `injectStack` | `boolean`             | instance default | Override stack capture per call.     |
| `levelValue`  | `number`              | `error`          | Override severity (see [`level`](#level)). |

Each created error is `instanceof Error` and has these fields:

| Field        | Type                          | Description                              |
| ------------ | ----------------------------- | ---------------------------------------- |
| `name`       | `string`                      | The error name, e.g. `"Fail"`.           |
| `message`    | `string`                      | The message you passed.                  |
| `code`       | `string`                      | Code equal to the name, e.g. `"Fail"`.   |
| `levelValue` | `number`                      | Severity (see [`level`](#level)).        |
| `stack`      | `string`                      | `"<name>: <message>"`, or a real trace with `injectStack`. |
| `cause`      | `AyamariErr \| Error \| null` | Chained cause.                           |
| `meta`       | `unknown`                     | Extra context data.                      |

By default `stack` is just `"<name>: <message>"`. Turn on `injectStack` to capture a real trace.

```ts
const { errs } = new Ayamari();

const err = errs.NotFound('User not found.', {
  meta: { userId: 42 },
});

console.log(err.code);    // "NotFound"
console.log(err.name);    // "NotFound"
console.log(err.message); // "User not found."
console.log(err.meta);    // { userId: 42 }
```

---

### `errsResult`

Same as `errs`, but wraps the error in an [@daisugi/anzen](../anzen) failure `Result`.

```ts
errsResult.<Name>(message: string, opts?: AyamariErrOpts): AnzenResultErr<AyamariErr>
```

```ts
import { ok } from '@daisugi/anzen';

const { errsResult } = new Ayamari();

function findUser(id: number) {
  if (id < 0) {
    return errsResult.InvalidArgument('id must be positive');
  }
  return ok({ id, name: 'Alice' });
}

const result = findUser(-1);

if (result.isErr) {
  console.log(result.unwrapErr().code); // "InvalidArgument"
}
```

---

### `errCode`

A map of error names to their string codes. Import it to reference codes without typing strings.

Each instance also exposes `codes`, which merges the built-ins with your custom codes.

Built-in codes:

| Name                         | Code                           | Description                          |
| ---------------------------- | ------------------------------ | ------------------------------------ |
| `UnexpectedError`            | `"UnexpectedError"`            | Catch-all for unhandled exceptions.  |
| `CircuitSuspended`           | `"CircuitSuspended"`           | Circuit breaker is open.             |
| `StopPropagation`            | `"StopPropagation"`            | Halt error propagation.              |
| `Fail`                       | `"Fail"`                       | Generic failure.                     |
| `InvalidArgument`            | `"InvalidArgument"`            | Bad input.                           |
| `ValidationFailed`           | `"ValidationFailed"`           | Validation rule failed.              |
| `CircularDependencyDetected` | `"CircularDependencyDetected"` | Circular dependency found.           |
| `NotFound`                   | `"NotFound"`                   | Resource not found.                  |
| `Timeout`                    | `"Timeout"`                    | Operation timed out.                 |

---

### `level`

Numeric severity levels (Pino-style). Higher means more severe, so monitoring can set thresholds.

| Name    | Value |
| ------- | ----- |
| `off`   | 100   |
| `fatal` | 60    |
| `error` | 50    |
| `warn`  | 40    |
| `info`  | 30    |
| `debug` | 20    |
| `trace` | 10    |

Every error defaults to `error` (50). Override it per error with `opts.levelValue`.

```ts
const { errs } = new Ayamari();

errs.NotFound('missing').levelValue;                   // 50 (default)
errs.NotFound('missing', { levelValue: level.debug })  // 20 (overridden)
  .levelValue;
```

`wrapErr` keeps the cause's `levelValue` on the new error.

---

### `wrapErr` / `wrapErrResult`

Re-wrap an error with a new message while keeping the original code. Useful at layer boundaries.

```ts
wrapErr(message: string, opts: { cause: AyamariErr | Error | AnzenResultErr<AyamariErr>, meta?: unknown }): AyamariErr
wrapErrResult(message: string, opts: { cause: AyamariErr | Error | AnzenResultErr<AyamariErr>, meta?: unknown }): AnzenResultErr<AyamariErr>
```

`cause` accepts three forms:

- An `AyamariErr` — reuses its code and severity.
- A native `Error` — falls back to `UnexpectedError`.
- An `AnzenResultErr<AyamariErr>` — automatically unwrapped; the extracted error is used as cause.

```ts
const { errs, wrapErr, wrapErrResult } = new Ayamari();

// From a plain error
function readConfig(path: string) {
  try {
    // ...
  } catch (err) {
    const inner = errs.UnexpectedError('Failed to read file.', { cause: err });
    return wrapErr('Config loading failed.', { cause: inner });
  }
}

// From a ResultErr — no manual unwrapErr() needed
function loadUser(id: number) {
  const result = findUser(id); // AnzenResultErr<AyamariErr>
  if (result.isErr) {
    return wrapErrResult('Failed to load user.', { cause: result });
  }
  return result;
}
```

The new error keeps the cause's code, so callers can match on it. If the cause is a native `Error` (or has an unknown code), it falls back to `UnexpectedError`.

---

### `formatStack`

Formats an error and its cause chain into a readable string. Import it only where you print errors.

```ts
formatStack(
  err: AyamariErr | Error,
  opts?: FormatStackOpts,
): string

interface FormatStackOpts {
  color?: boolean;           // default: false
  sensitiveKeys?: readonly string[];
  frameFilter?: FrameFilter;
}
```

| Option          | Description                                                                 |
| --------------- | -------------------------------------------------------------------------- |
| `color`         | Enable ANSI colors. Turn off for log files or non-TTY streams.             |
| `sensitiveKeys` | Property names to redact (e.g. `['config', 'response']`).                  |
| `frameFilter`   | Keep or drop individual stack frames. The default drops `node:` frames.   |

The formatted output:

- Shows the error name in red.
- Prints `meta` and extra props in gray.
- Shows your source frames with the current directory as `~`.
- Collapses `node_modules` frames into one line per package.
- Deduplicates frames shared across the cause chain.
- Separates causes with a `└── caused by 🚨:` line.

```ts
const { errs } = new Ayamari({ injectStack: true });

const cause = new Error('DB connection refused');
const err = errs.UnexpectedError('Request failed', {
  cause,
  meta: { url: '/api/users' },
});

console.error(formatStack(err, { color: true }));
```

Example output:

<pre>
<span style="color:red">UnexpectedError</span>: Request failed
<span style="color:green">  url</span><span style="color:#888">: /api/users</span>
    <span style="color:#888">at</span> <span style="color:cyan">processRequest</span> <span style="color:#888">(</span><span style="color:yellow">~/src/server.ts</span><span style="color:cyan">:42:12</span><span style="color:#888">)</span>
    <span style="color:#888">at</span> <span style="color:cyan">handleRoute</span> <span style="color:#888">(</span><span style="color:yellow">~/src/router.ts</span><span style="color:cyan">:18:5</span><span style="color:#888">)</span>
<span style="color:#888">    ... 3 frames in [express@4.18.2]</span>
<span style="color:#888">    ... 1 frame in [http-proxy-middleware@3.0.3]</span>
 <span style="color:red">└── caused by 🚨:</span> Error: DB connection refused
    <span style="color:#888">at</span> <span style="color:cyan">connect</span> <span style="color:#888">(</span><span style="color:yellow">~/src/db.ts</span><span style="color:cyan">:10:3</span><span style="color:#888">)</span>
<span style="color:#888">    ... 2 frames in [pg@8.11.0]</span>
</pre>

Keep only frames from your own source:

```ts
formatStack(err, {
  frameFilter: (frame) => frame.file.startsWith('/home/me/project/src'),
});
```

---

### `isAyamariErr`

Type guard for errors created by Ayamari. Use it in a `catch` to safely read `code` / `levelValue` / `meta`.

```ts
import { isAyamariErr } from '@daisugi/ayamari';

try {
  await doWork();
} catch (e) {
  if (isAyamariErr(e)) {
    // e is typed as AyamariErr here
    console.log(e.code, e.levelValue);
  }
}
```

It matches only Ayamari errors, even across bundles. A native error that happens to carry a `code` (like Node's `ENOENT`) is never mistaken for one.

---

### `findCauseByCode`

Walks an error's cause chain (the error itself first) and returns the first match by `code`, or `null`. Lets a boundary branch on a failure mode no matter how deeply it was wrapped.

```ts
try {
  await query();
} catch (e) {
  if (findCauseByCode(e, errCode.Timeout)) return retry();
  const notFound = findCauseByCode(e, errCode.NotFound);
  if (notFound) return respond(404);
  throw e;
}
```

It reads `code` generically, so a native error in the chain (like `ENOENT`) can match too. Cyclic chains are handled safely.

---

### Custom error codes

Pass `customErrCode` to add your own codes. The instance's `errs`, `errsResult`, and `codes` update automatically.

```ts
const customErrCode = {
  PaymentDeclined: 'PaymentDeclined',
  RateLimitExceeded: 'RateLimitExceeded',
} as const;

const { errs, codes } = new Ayamari({ customErrCode });

const err = errs.PaymentDeclined('Card was declined.');
console.log(err.code); // "PaymentDeclined"

// TypeScript: errs and codes are fully typed with your custom codes.
```

[:top: Back to top](#-table-of-contents)

---

## 🌍 Other Projects

[Meet the ecosystem](../../README.md)

[:top: Back to top](#-table-of-contents)

---

## 📜 License

[MIT](../../LICENSE)
