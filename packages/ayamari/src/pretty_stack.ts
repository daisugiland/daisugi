import type { AyamariErr } from './ayamari.js';

export interface ParsedFrame {
  methodName: string;
  /** Source path, or `<anonymous>` for builtin frames. */
  file: string;
  /** Undefined for builtin frames that have no source location. */
  lineNumber: string | undefined;
  column: string | undefined;
}

/** Predicate deciding whether a parsed frame is kept in the output. */
export type FrameFilter = (frame: ParsedFrame) => boolean;

export interface PrettyStackOpts {
  color?: boolean;
  sensitiveKeys?: readonly string[];
  frameFilter?: FrameFilter;
}

interface Palette {
  reset: string;
  red: string;
  gray: string;
  cyan: string;
  yellow: string;
  green: string;
}

/** Kindly borrowed from https://github.com/errwischt/stacktrace-parser/blob/master/src/stack-trace-parser.js */
const frameRe =
  /^\s*at (?:((?:\[object object\])?[^\\/]+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/iu;

/**
 * Builtin frames carry a method name but no source location, e.g.
 * `at Array.map (<anonymous>)`. V8 emits these for higher-order builtins
 * (Array.map/sort/forEach, JSON.parse, String.replace, ...).
 */
const anonFrameRe = /^\s*at (.+?) \((<anonymous>)\)\s*$/iu;

/** Fallback for frames whose method name V8 could not resolve. */
const unknownFunction = '<unknown>';

/** Matches the pnpm virtual store dir: /node_modules/.pnpm/<pkg-dir>/node_modules/ */
const pnpmPkgRe =
  /\/node_modules\/\.pnpm\/([^/]+)\/node_modules\//u;

/** Matches the first package segment of a regular node_modules path */
const npmPkgRe = /\/node_modules\/((?:@[^/]+\/)?[^/]+)\//u;

const colorPalette: Palette = {
  reset: '\u001B[0m',
  red: '\u001B[31m',
  gray: '\u001B[90m',
  cyan: '\u001B[36m',
  yellow: '\u001B[33m',
  green: '\u001B[32m',
};

const noColorPalette: Palette = {
  reset: '',
  red: '',
  gray: '',
  cyan: '',
  yellow: '',
  green: '',
};

const standardErrorKeys = new Set([
  'message',
  'stack',
  'name',
  'cause',
]);

/** AyamariErr internal fields that are already surfaced elsewhere in the log */
const ayamariErrKeys = new Set(['code', 'levelValue']);

/** Default frame filter: drop Node internal (`node:`) frames. */
export const defaultFrameFilter: FrameFilter = (frame) =>
  !frame.file.startsWith('node:');

function parseFrame(line: string): ParsedFrame | null {
  const match = frameRe.exec(line);
  if (match) {
    const file = match[2];
    if (file === undefined) {
      return null;
    }
    return {
      methodName: match[1] ?? unknownFunction,
      file,
      lineNumber: match[3],
      column: match[4],
    };
  }
  const anon = anonFrameRe.exec(line);
  if (anon) {
    return {
      methodName: anon[1] ?? unknownFunction,
      file: anon[2] ?? '<anonymous>',
      lineNumber: undefined,
      column: undefined,
    };
  }
  return null;
}

/**
 * Extracts a human-readable package identifier from a node_modules path.
 * - pnpm:  /node_modules/.pnpm/react-dom@19.2.3_react@19.2.3/node_modules/react-dom/...
 *          → "react-dom@19.2.3"
 * - pnpm scoped: /node_modules/.pnpm/@fastify+static@8.0.0/node_modules/@fastify/static/...
 *          → "@fastify/static@8.0.0"
 * - npm:   /node_modules/fastify/...
 *          → "fastify"
 */
function extractPackageFromPath(
  path: string,
): string | null {
  const pnpmMatch = pnpmPkgRe.exec(path);
  if (pnpmMatch?.[1]) {
    // pnpm encodes @scope/pkg as @scope+pkg — restore the slash
    const normalized = pnpmMatch[1].replace(
      /^(@[^+]+)\+/u,
      '$1/',
    );
    // strip peer-deps suffix (everything after the first _)
    return normalized.split('_')[0] ?? normalized;
  }
  const npmMatch = npmPkgRe.exec(path);
  if (npmMatch?.[1]) {
    return npmMatch[1];
  }
  return null;
}

function safeStringify(value: unknown): string {
  const ancestors: object[] = [];
  try {
    return (
      JSON.stringify(
        value,
        function replacer(
          this: unknown,
          _key: string,
          val: unknown,
        ): unknown {
          if (typeof val !== 'object' || val === null) {
            return val;
          }
          // Trim ancestors back to the current parent so siblings start fresh.
          // `this` is the parent object JSON.stringify is currently serializing.
          // Note: JSON.stringify can re-emit a property when toJSON returns
          // another object, so an exact-equality lookup is safest here.
          while (
            ancestors.length > 0 &&
            ancestors.at(-1) !== this
          ) {
            ancestors.pop();
          }
          if (ancestors.includes(val)) {
            return '[Circular]';
          }
          ancestors.push(val);
          return val;
        },
      ) ?? '[Unserializable]'
    );
  } catch (err) {
    return `[Unserializable: ${(err as Error).message}]`;
  }
}

// Registry-global brand stamped by Ayamari on every AyamariErr. Recomputed
// here (rather than imported) to avoid a value cycle with ayamari.ts;
// `Symbol.for` guarantees it resolves to the same symbol. Keep in sync.
const ayamariBrand = Symbol.for('@daisugi/ayamari');

function isAyamariErr(err: AyamariErr | Error): boolean {
  return (
    (err as unknown as Record<symbol, unknown>)[
      ayamariBrand
    ] === true
  );
}

function formatExtraProps(
  err: AyamariErr | Error,
  c: Palette,
  sensitiveKeys: Set<string>,
): string[] {
  const result: string[] = [];
  const skipAyamariKeys = isAyamariErr(err);
  for (const key of Object.keys(err)) {
    if (standardErrorKeys.has(key)) {
      continue;
    }
    if (skipAyamariKeys && ayamariErrKeys.has(key)) {
      continue;
    }
    // Caller-configured keys to redact (e.g. AxiosError's `config` /
    // `request` / `response`, which carry cookies and auth headers).
    if (sensitiveKeys.has(key)) {
      continue;
    }
    const value = (
      err as unknown as Record<string, unknown>
    )[key];
    if (value === null || value === undefined) {
      continue;
    }
    const formatted =
      typeof value === 'object'
        ? safeStringify(value)
        : String(value);
    result.push(
      `${c.green}  ${key}${c.reset}${c.gray}: ${formatted}${c.reset}`,
    );
  }
  return result;
}

function processFrames(
  lines: string[],
  seen: Set<string>,
  cwd: string,
  c: Palette,
  frameFilter: FrameFilter,
): string[] {
  const result: string[] = [];
  let currentPkg: string | null = null;
  let pkgCount = 0;

  function flushGroup(): void {
    if (currentPkg !== null) {
      const label = pkgCount > 1 ? 'frames' : 'frame';
      result.push(
        `${c.gray}    ... ${pkgCount} ${label} in [${currentPkg}]${c.reset}`,
      );
      currentPkg = null;
      pkgCount = 0;
    }
  }

  for (const line of lines.slice(1)) {
    const frame = parseFrame(line);
    if (frame === null || !frameFilter(frame)) {
      continue;
    }
    // Removing duplicated lines (shared across the cause chain).
    if (seen.has(line)) {
      continue;
    }
    seen.add(line);
    const pkg = extractPackageFromPath(frame.file);
    if (pkg) {
      if (pkg !== currentPkg) {
        flushGroup();
        currentPkg = pkg;
        pkgCount = 0;
      }
      pkgCount++;
    } else {
      flushGroup();
      result.push(formatFrame(frame, cwd, c));
    }
  }
  flushGroup();

  return result;
}

function formatFrame(
  frame: ParsedFrame,
  cwd: string,
  c: Palette,
): string {
  // Replacing current directory.
  const file = frame.file.replaceAll(cwd, '~');
  const linePart =
    frame.lineNumber === undefined
      ? ''
      : frame.column === undefined
        ? `${c.cyan}:${frame.lineNumber}${c.reset}`
        : `${c.cyan}:${frame.lineNumber}:${frame.column}${c.reset}`;
  return `    ${c.gray}at${c.reset} ${c.cyan}${frame.methodName}${c.reset} ${c.gray}(${c.reset}${c.yellow}${file}${c.reset}${linePart}${c.gray})${c.reset}`;
}

function formatHeader(line: string, c: Palette): string {
  const sepIdx = line.indexOf(': ');
  if (sepIdx === -1) {
    return `${c.red}${line}${c.reset}`;
  }
  const name = line.slice(0, sepIdx);
  const message = line.slice(sepIdx + 2);
  return `${c.red}${name}${c.reset}${c.gray}:${c.reset} ${message}`;
}

export class PrettyStack {
  static print(
    error: AyamariErr | Error,
    opts: PrettyStackOpts = {},
  ): string {
    const color = opts.color ?? false;
    const sensitiveKeys = opts.sensitiveKeys ?? [];
    const frameFilter =
      opts.frameFilter ?? defaultFrameFilter;
    const c = color ? colorPalette : noColorPalette;
    const sensitive = new Set(sensitiveKeys);
    const chain: Array<AyamariErr | Error> = [];
    let cursor: AyamariErr | Error | null | undefined =
      error;
    while (cursor) {
      chain.push(cursor);
      cursor = (cursor as AyamariErr).cause;
    }
    const seen = new Set<string>();
    const cwd =
      typeof process === 'undefined' ? '' : process.cwd();
    const parts = chain.map((err) => {
      const rawStack =
        err.stack ?? `${err.name}: ${err.message}`;
      const lines = rawStack.split('\n');
      const header = formatHeader(lines[0] ?? '', c);
      const frames = processFrames(
        lines,
        seen,
        cwd,
        c,
        frameFilter,
      );
      const extras = formatExtraProps(err, c, sensitive);
      return [header, ...extras, ...frames].join('\n');
    });

    return parts.join(
      `\n ${c.red}└── caused by 🚨:${c.reset} `,
    );
  }
}
