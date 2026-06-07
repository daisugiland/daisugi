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
  const appErr = errFn.UnexpectedError('Something went wrong.', {
    cause: err,
  });

  console.error(Ayamari.prettifyStack(appErr, { color: true }));
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
    - [new Ayamari(opts?)](#new-ayamariopts)
    - [errFn](#errfn)
    - [errFnRes](#errfnres)
    - [errCode](#errcode)
    - [propagateErr / propagateErrRes](#propagateerr--propagateerrres)
    - [Ayamari.prettifyStack](#ayamariprettifystack)
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

**Ayamari** improves error handling by simplifying the creation of rich, contextual errors. It enhances the legibility of exception output and provides useful features such as:

- ✅ No stack generation by default (for performance)
- ✅ Chained causes
- ✅ Additional properties for extra context
- ✅ Custom error codes
- ✅ Pretty stack traces
- ✅ Errors are `instanceof Error`
- ✅ Result-type integration via [@daisugi/anzen](../anzen)

[:top: Back to top](#-table-of-contents)

---

## 📚 API

### `new Ayamari(opts?)`

Creates an Ayamari instance.

| Option | Type | Default | Description |
|---|---|---|---|
| `injectStack` | `boolean` | `false` | Capture a real V8 stack trace on each error (has a performance cost). |
| `customErrCode` | `object` | — | Additional error codes to merge with the built-in set (see [Custom error codes](#custom-error-codes)). |

```ts
const ayamari = new Ayamari({
  injectStack: true,
});
```

---

### `errFn`

A map of error-creator functions, one per error code. Each function has the signature:

```ts
errFn.<Name>(message: string, opts?: AyamariOpts): AyamariErr
```

| Option | Type | Default | Description |
|---|---|---|---|
| `cause` | `AyamariErr \| Error` | — | The underlying error that caused this one. |
| `meta` | `unknown` | `null` | Arbitrary extra data attached to the error (surfaced in pretty-print). |
| `injectStack` | `boolean` | instance default | Override stack injection per call. |

Every created error is a lightweight object (`AyamariErr`) — its prototype is `Error.prototype`, so `err instanceof Error` is `true`, but no native `Error` is constructed (no stack-capture cost unless `injectStack` is enabled). It has these fields:

| Field | Type | Description |
|---|---|---|
| `name` | `string` | `"<Name> [<code>]"`, e.g. `"Fail [575]"` |
| `message` | `string` | The message you passed. |
| `code` | `number` | Numeric error code. |
| `stack` | `string` | `"<name>: <message>"` — or a real stack trace when `injectStack` is true. |
| `cause` | `AyamariErr \| Error \| null` | Chained cause. |
| `meta` | `unknown` | Extra context data. |

```ts
const { errFn } = new Ayamari();

const err = errFn.NotFound('User not found.', {
  meta: { userId: 42 },
});

console.log(err.code);      // 404
console.log(err.name);      // "NotFound [404]"
console.log(err.message);   // "User not found."
console.log(err.meta);      // { userId: 42 }
```

---

### `errFnRes`

Same as `errFn` but wraps the error in an [@daisugi/anzen](../anzen) `Result.failure`:

```ts
errFnRes.<Name>(message: string, opts?: AyamariOpts): AnzenResultFailure<AyamariErr>
```

```ts
const { errFnRes } = new Ayamari();

function findUser(id: number) {
  if (id < 0) {
    return errFnRes.InvalidArgument('id must be positive');
  }
  return Result.success({ id, name: 'Alice' });
}

const result = findUser(-1);

if (result.isFailure) {
  console.log(result.getError().code); // 576
}
```

---

### `errCode`

The full map of error names to numeric codes available on the instance (built-ins merged with any `customErrCode`).

Built-in codes:

| Name | Code | Description |
|---|---|---|
| `UnexpectedError` | 571 | Catch-all for unhandled exceptions. |
| `CircuitSuspended` | 572 | Circuit breaker is open. |
| `StopPropagation` | 574 | Signals that error propagation should halt. |
| `Fail` | 575 | Generic failure. |
| `InvalidArgument` | 576 | Bad input. |
| `ValidationFailed` | 577 | Validation rule failed. |
| `CircularDependencyDetected` | 578 | Circular dependency found. |
| `NotFound` | 404 | Resource not found. |
| `Timeout` | 504 | Operation timed out. |

---

### `propagateErr` / `propagateErrRes`

Re-create an error of the same code as the cause, adding a new message and context. Useful for wrapping errors at layer boundaries without losing the original code.

```ts
propagateErr(message: string, opts: { cause: AyamariErr | Error, meta?: unknown }): AyamariErr
propagateErrRes(message: string, opts: { cause: AyamariErr | Error, meta?: unknown }): AnzenResultFailure<AyamariErr>
```

```ts
const { errFn, propagateErr } = new Ayamari();

function readConfig(path: string) {
  try {
    // ...
  } catch (err) {
    const inner = errFn.UnexpectedError('Failed to read file.', { cause: err });
    return propagateErr('Config loading failed.', { cause: inner });
  }
}
```

The propagated error has the same numeric code as `cause` so callers can pattern-match on code without knowing the internal boundary. When `cause` is a native `Error` (or carries a code Ayamari doesn't recognize), it falls back to `UnexpectedError`.

---

### `Ayamari.prettifyStack`

Static method that formats an error (and its cause chain) as a human-readable string.

```ts
Ayamari.prettifyStack(
  err: AyamariErr | Error,
  opts?: PrettyStackOpts,
): string

interface PrettyStackOpts {
  color?: boolean;           // default: false
  sensitiveKeys?: readonly string[];
  frameFilter?: FrameFilter;
}
```

| Option | Description |
|---|---|
| `color` | Enable ANSI color codes. Disable when writing to log files or non-TTY streams. |
| `sensitiveKeys` | Property names to redact from the extra-props section (e.g. `['config', 'response']` for Axios errors). |
| `frameFilter` | Predicate to keep or drop individual stack frames. The default filter (`Ayamari.defaultFrameFilter`) drops `node:` built-in frames. |

Features of the formatted output:

- The error name in the header is shown in red.
- `meta` and other extra properties are printed in gray below the header.
- Frames from your source code are shown with the current directory replaced by `~`.
- Frames from `node_modules` packages are collapsed into a single summary line per package (`... N frames in [pkg@version]`).
- Duplicate frames shared across the cause chain are deduplicated.
- Causes are separated by a `└── caused by 🚨:` connector.

```ts
const { errFn } = new Ayamari({ injectStack: true });

const cause = new Error('DB connection refused');
const err = errFn.UnexpectedError('Request failed', {
  cause,
  meta: { url: '/api/users' },
});

console.error(Ayamari.prettifyStack(err, { color: true }));
```

Example output:

<pre>
<span style="color:red">UnexpectedError [571]</span>: Request failed
<span style="color:green">  url</span><span style="color:#888">: /api/users</span>
    <span style="color:#888">at</span> <span style="color:cyan">processRequest</span> <span style="color:#888">(</span><span style="color:yellow">~/src/server.ts</span><span style="color:cyan">:42:12</span><span style="color:#888">)</span>
    <span style="color:#888">at</span> <span style="color:cyan">handleRoute</span> <span style="color:#888">(</span><span style="color:yellow">~/src/router.ts</span><span style="color:cyan">:18:5</span><span style="color:#888">)</span>
<span style="color:#888">    ... 3 frames in [express@4.18.2]</span>
<span style="color:#888">    ... 1 frame in [http-proxy-middleware@3.0.3]</span>
 <span style="color:red">└── caused by 🚨:</span> Error: DB connection refused
    <span style="color:#888">at</span> <span style="color:cyan">connect</span> <span style="color:#888">(</span><span style="color:yellow">~/src/db.ts</span><span style="color:cyan">:10:3</span><span style="color:#888">)</span>
<span style="color:#888">    ... 2 frames in [pg@8.11.0]</span>
</pre>

To filter frames by file path (e.g. keep only your own source):

```ts
Ayamari.prettifyStack(err, {
  frameFilter: (frame) => frame.file.startsWith('/home/me/project/src'),
});
```

---

### Custom error codes

Pass a `customErrCode` map to extend the built-in set. The instance's `errFn`, `errFnRes`, and `errCode` are all updated automatically.

```ts
const customErrCode = {
  PaymentDeclined: 402,
  RateLimitExceeded: 429,
} as const;

const { errFn, errCode } = new Ayamari({ customErrCode });

const err = errFn.PaymentDeclined('Card was declined.');
console.log(err.code); // 402

// TypeScript: errFn and errCode are fully typed with your custom codes.
```

[:top: Back to top](#-table-of-contents)

---

## 🌍 Other Projects

[Meet the ecosystem](../../README.md)

[:top: Back to top](#-table-of-contents)

---

## 📜 License

[MIT](../../LICENSE)
