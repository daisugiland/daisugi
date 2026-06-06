import type { AyamariErr } from './ayamari.js';

/** Kindly borrowed from https://github.com/errwischt/stacktrace-parser/blob/master/src/stack-trace-parser.js */
const FRAME_RE =
  /^\s*at (?:((?:\[object object\])?[^\\/]+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/iu;

/** Matches the pnpm virtual store dir: /node_modules/.pnpm/<pkg-dir>/node_modules/ */
const PNPM_PKG_RE =
  /\/node_modules\/\.pnpm\/([^/]+)\/node_modules\//u;

/** Matches the first package segment of a regular node_modules path */
const NPM_PKG_RE =
  /\/node_modules\/((?:@[^/]+\/)?[^/]+)\//u;

interface Palette {
  reset: string;
  red: string;
  gray: string;
  cyan: string;
  bgRed: string;
}

const COLOR: Palette = {
  reset: '\u001B[0m',
  red: '\u001B[31m',
  gray: '\u001B[90m',
  cyan: '\u001B[36m',
  bgRed: '\u001B[41m',
};

const NO_COLOR: Palette = {
  reset: '',
  red: '',
  gray: '',
  cyan: '',
  bgRed: '',
};

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
  const pnpmMatch = PNPM_PKG_RE.exec(path);
  if (pnpmMatch?.[1]) {
    // pnpm encodes @scope/pkg as @scope+pkg — restore the slash
    const normalized = pnpmMatch[1].replace(
      /^(@[^+]+)\+/u,
      '$1/',
    );
    // strip peer-deps suffix (everything after the first _)
    return normalized.split('_')[0] ?? normalized;
  }
  const npmMatch = NPM_PKG_RE.exec(path);
  if (npmMatch?.[1]) {
    return npmMatch[1];
  }
  return null;
}

const STANDARD_ERROR_KEYS = new Set([
  'message',
  'stack',
  'name',
  'cause',
]);

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

/** AyamariErr internal fields that are already surfaced elsewhere in the log */
const AYAMARI_ERR_KEYS = new Set([
  'code',
  'levelValue',
  'createdAt',
]);

function isAyamariErr(err: AyamariErr | Error): boolean {
  return 'levelValue' in err;
}

function formatExtraProps(
  err: AyamariErr | Error,
  c: Palette,
  sensitiveKeys: Set<string>,
): string[] {
  const result: string[] = [];
  const skipAyamariKeys = isAyamariErr(err);
  for (const key of Object.keys(err)) {
    if (STANDARD_ERROR_KEYS.has(key)) {
      continue;
    }
    if (skipAyamariKeys && AYAMARI_ERR_KEYS.has(key)) {
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
      `${c.gray}  ${key}: ${formatted}${c.reset}`,
    );
  }
  return result;
}

function processFrames(
  lines: string[],
  seen: Set<string>,
  cwd: string,
  c: Palette,
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
    const match = FRAME_RE.exec(line);
    if (!match) {
      continue;
    }
    const path = match[2];
    if (path === undefined || path.startsWith('node:')) {
      continue;
    }
    // Removing duplicated lines (shared across the cause chain).
    if (seen.has(line)) {
      continue;
    }
    seen.add(line);
    const pkg = extractPackageFromPath(path);
    if (pkg) {
      if (pkg !== currentPkg) {
        flushGroup();
        currentPkg = pkg;
        pkgCount = 0;
      }
      pkgCount++;
    } else {
      flushGroup();
      // Replacing current directory.
      result.push(
        `${c.cyan}${line.replaceAll(cwd, '~')}${c.reset}`,
      );
    }
  }
  flushGroup();

  return result;
}

function formatHeader(line: string, c: Palette): string {
  const sepIdx = line.indexOf(': ');
  if (sepIdx === -1) {
    return `${c.bgRed}${line}${c.reset}`;
  }
  const name = line.slice(0, sepIdx);
  const message = line.slice(sepIdx + 2);
  return `${c.bgRed}${name}${c.reset}${c.gray}:${c.reset} ${message}`;
}

export class PrettyStack {
  static print(
    error: AyamariErr | Error,
    color = false,
    sensitiveKeys: readonly string[] = [],
  ): string {
    const c = color ? COLOR : NO_COLOR;
    const sensitive = new Set(sensitiveKeys);
    const chain: Array<AyamariErr | Error> = [];
    let cursor: AyamariErr | Error | null | undefined =
      error;
    while (cursor) {
      chain.push(cursor);
      cursor = (cursor as AyamariErr).cause;
    }
    const seen = new Set<string>();
    const cwd = process.cwd();
    const parts = chain.map((err) => {
      const rawStack =
        err.stack ?? `${err.name}: ${err.message}`;
      const lines = rawStack.split('\n');
      const header = formatHeader(lines[0] ?? '', c);
      const frames = processFrames(lines, seen, cwd, c);
      const extras = formatExtraProps(err, c, sensitive);
      return [header, ...extras, ...frames].join('\n');
    });

    return parts.join(
      `\n ${c.red}└── caused by 🚨:${c.reset} `,
    );
  }
}
