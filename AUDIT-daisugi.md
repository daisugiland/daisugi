# Daisugi package audit

Scope: `packages/daisugi` (`src/daisugi.ts`, `src/types.ts`, tests). Cross-referenced against the already tree-shakeable Anzen, Ayamari, Kado, and Kintsugi packages.

## Bugs

### 1. Decorators crash when no handler opts into the toolkit
`src/daisugi.ts:28,47`

`toolkit` is declared but only assigned inside `if (injectToolkit)`. It is then passed to every decorator unconditionally:

```ts
userHandlerDecorator(currentUserHandler, toolkit as DaisugiToolkit)
```

If a sequence has decorators but a handler without `meta.injectToolkit`, the decorator receives `undefined`. Any decorator that touches the toolkit (e.g. the `extend toolkit` pattern in `daisugi_test.ts:648`) throws `TypeError`. The `as DaisugiToolkit` cast hides this from the type checker.

### 2. Concurrency hazard: the toolkit object is shared across invocations
`src/daisugi.ts:31-41,73-80`

`toolkit` is built once per handler at compile time, then `toolkit.next` is re-defined per call via `Object.defineProperty`. For a sequence invoked concurrently (the normal case for HTTP middleware), if a handler `await`s anything *before* reading `toolkit.next`, a second in-flight request can redefine `next` in the gap, so the first request reads the second's args.

Sequential and single-flight tests pass, which is why this is latent. Fix: allocate a fresh toolkit per invocation instead of reusing one.

### 3. `isErr` duck-typing misfires on plain objects
`src/daisugi.ts:60`

```ts
if (args[0]?.isErr) { ... }
```

Any object with a truthy `isErr` is treated as a Result. A handler legitimately returning `{ isErr: true, ... }` (not a Result) hits `unwrapErr()` and throws. The code comment already flags this. Anzen now exports `isAnzenResult` — use it.

### 4. Fragile async detection
`src/daisugi.ts:17-19`

```ts
handler.constructor.name === 'AsyncFunction'
```

Breaks when handlers are transpiled to ES2015-or-lower (async functions lose that constructor) or wrapped by a decorator that returns a non-async function. A sync handler that returns a Promise is also misclassified and never awaited (`src/daisugi.ts:96`). At minimum, document that handlers must be native async functions.

## Improvements

- **Use the official guard** (`src/daisugi.ts:60`): `import { isAnzenResult }` and check `isAnzenResult(args[0]) && args[0].isErr`. Removes bug #3.
- **`meta: any` weakens safety** (`src/types.ts`; Ayamari's `meta: any`): `unwrapErr().meta.value` (`src/daisugi.ts:68`) compiles only because `meta` is `any`. Type the stop-propagation payload as `{ value: unknown }`, or narrow at the read site.
- **Leftover TODOs signal unverified behavior**: `src/daisugi.ts:57,59` and `// TODO: Need to be reviewed.` in `daisugi_test.ts:562` (the assertion `'012356748'` for mixed sync/async ordering looks observed, not specified). Confirm the ordering is intended and lock it down, or fix it.
- **`Object.defineProperty` per call** (`src/daisugi.ts:73`) is slower than a plain closure. Combined with the fresh-toolkit fix (#2), define `next` once as a getter over a per-invocation closure.
- **Typed accumulator hack** (`src/daisugi.ts:114`): replace `null as any as DaisugiHandler` with an accumulator typed `DaisugiHandler | null`.

## Best-practice suggestions

- **Generics over `any`**: `DaisugiHandler` is `(...args: any): any`. A generic `DaisugiHandler<Args extends unknown[], R>` would give callers real inference on `sequenceOf(...)(input)` instead of `any`.
- **Public error surface**: the package depends on Ayamari only to detect two string codes (`Fail`, `StopPropagation`) and to build two errors. Import the `errCode` constant for the comparison rather than constructing an instance (see tree-shaking below).
- **README parity**: the `daisugi` package README was not part of the recent concise/API-doc rewrite of the other packages — give it the same treatment for consistency.

## Performance / tree-shaking

The other packages were already refactored to tree-shakeable named exports (commits `52837f3`, `f2c1e8f`). `daisugi` is the remaining outlier.

### 1. Convert the class to named function exports
`src/daisugi.ts:118-144`

A class bundles everything together: importing `Daisugi` pulls in `sequenceOf`, `failWith`, and `stopPropagationWith` even if you use one. Export free functions so bundlers can drop the unused ones:

```ts
export function createSequenceOf(decorators: DaisugiHandlerDecorator[] = []) { /* existing body */ }
export function stopPropagationWith(value: unknown) { /* ... */ }
export function failWith(value: unknown) { /* ... */ }
```

Keep a thin `Daisugi` class as a deprecated compat shim if the current API must be preserved. Internally, `decorateHandler` should call the free `failWith` (`src/daisugi.ts:39`) rather than `Daisugi.failWith`.

### 2. Decouple the hot path from `new Ayamari()`
`src/daisugi.ts:14,62,66`

`const { errs, codes } = new Ayamari()` runs on import and ties the core pipeline to a full Ayamari instance. The pipeline only needs two string constants. Import the tree-shakeable `errCode` constant instead:

```ts
import { errCode } from '@daisugi/ayamari';
// ...
if (firstArg.unwrapErr().code === errCode.Fail) { ... }
if (firstArg.unwrapErr().code === errCode.StopPropagation) { ... }
```

Then the `errs` instance is referenced only by `failWith` / `stopPropagationWith`. Build it lazily there (memoized), so a consumer who imports only `createSequenceOf` never constructs an Ayamari at all.

### 3. Net effect on import cost

With the comparison using a constant and error creation lazy, `import { createSequenceOf }` pulls in zero Ayamari runtime construction, and `import { failWith }` pulls in only what it needs. Today every import path eagerly constructs the full error map.

**Caveat**: `package.json` already declares `"sideEffects": false`, which is correct, but the current top-level `new Ayamari()` is a real module-eval side effect. Moving it lazy (change #2) is what makes that annotation fully honest.
