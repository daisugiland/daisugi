import type { AyamariErr } from './ayamari.js';

export class PrettyStack {
  /** Kindly borrowed from https://github.com/errwischt/stacktrace-parser/blob/master/src/stack-trace-parser.js */
  static #lineRe =
    /^\s*at (?:((?:\[object object\])?[^\\/]+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/iu;
  static #errMsgRe = /^([^:]*):\s(.*)/u;
  static #filenameRe = /^.*[\\/]/u;
  static #color = {
    reset: '\u001B[0m',
    red: '\u001B[31m',
    green: '\u001B[32m',
    yellow: '\u001B[33m',
    cyan: '\u001B[36m',
    gray: '\u001B[90m',
    bgRed: '\u001B[41m',
  };
  static #noColor = {
    reset: '',
    red: '',
    green: '',
    yellow: '',
    cyan: '',
    gray: '',
    bgRed: '',
  };

  static print(err: AyamariErr, color: boolean) {
    const { gray, yellow, reset, cyan, green, bgRed, red } =
      color ? PrettyStack.#color : PrettyStack.#noColor;
    let nextErr: Error = err;
    const stacks = [];
    while (nextErr) {
      stacks.unshift(nextErr.stack || '');
      nextErr = nextErr.cause as Error;
    }
    let prettyStacks = '';
    const lines: string[] = [];
    let stackIndex = 0;
    for (const stack of stacks) {
      let stackLineIndex = 0;
      let prettyStack = '';
      stackIndex++;
      for (const line of stack.split('\n')) {
        stackLineIndex++;
        if (stackLineIndex === 1) {
          const [, errName, errMsg] =
            PrettyStack.#errMsgRe.exec(line) || [];
          const causeBy =
            stacks.length === stackIndex
              ? ''
              : `${red}└──${reset} `;
          prettyStack += `  ${causeBy}${bgRed}${errName}${reset}${gray}:${reset} ${errMsg}\n`;
          continue;
        }
        const parsedLine = PrettyStack.#parseLine(line);
        if (!parsedLine) {
          continue;
        }
        const { methodName, lineNumber, column, path } =
          parsedLine;
        // Removing NodeJS native errors.
        if (path.startsWith('node:')) {
          continue;
        }
        /** Removing duplicated lines. */
        if (lines.includes(line)) {
          continue;
        }
        // Replacing current directory.
        const shortPath = path.replace(process.cwd(), '~');
        // Extracting `filename`.
        const filename = path.replace(
          PrettyStack.#filenameRe,
          '',
        );
        // Printing code line.
        prettyStack += `\n  ${gray}- ${yellow}${filename} ${green}${lineNumber} ${cyan}${methodName}\n    ${gray}${shortPath}:${lineNumber}:${column}${reset}\n`;
        lines.push(line);
      }
      prettyStacks = `\n${prettyStack}\n${prettyStacks}`;
    }
    return prettyStacks;
  }

  static #parseLine(line: string) {
    const parts = PrettyStack.#lineRe.exec(line);
    if (!parts) {
      return null;
    }
    return {
      path: parts[2]!,
      methodName: parts[1] ?? '<unknown>',
      lineNumber: Number(parts[3]!),
      column: parts[4] ? Number(parts[4]) : null,
    };
  }
}
