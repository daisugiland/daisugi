import { Result } from '@daisugi/anzen';

export interface AppErrOpts {
  cause?: Error;
  data?: any;
  args?: IArguments;
  isOperational?: boolean;
}

export class AppErr extends Error {
  code: ErrCode;
  name: string;
  data?: any;
  args?: unknown[];
  isOperational: boolean;

  constructor(
    errCode: ErrCode,
    msg: string,
    opts: AppErrOpts = {},
  ) {
    super(msg, opts);
    Object.setPrototypeOf(this, AppErr.prototype);
    this.code = errCode;
    this.name = `${errCodeToName[errCode]} [${errCode}]`;
    if (opts.data) {
      this.data = opts.data;
    }
    if (opts.args) {
      this.args = Array.from(opts.args);
    }
    this.isOperational = opts.isOperational ?? true;
  }

  prettyStack(noColor = false) {
    return prettyStack(
      this,
      [],
      true,
      noColor ? stubColor : color,
    );
  }
}

/** Kindly borrowed from https://github.com/errwischt/stacktrace-parser/blob/master/src/stack-trace-parser.js */
const lineRe =
  /^\s*at (?:((?:\[object object\])?[^\\/]+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;
const errMsgRe = /^(.*)\:\s(.*)/;
const filenameRe = /^.*[\\\/]/;

function parseLine(line: string) {
  const parts = lineRe.exec(line);
  if (!parts) {
    return null;
  }
  return {
    path: parts[2],
    methodName: parts[1] || '<unknown>',
    lineNumber: Number(parts[3]),
    column: parts[4] ? Number(parts[4]) : null,
  };
}

const color = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
};

const stubColor = Object.fromEntries(
  Object.entries(color).map(([colorName]) => [
    colorName,
    '',
  ]),
);

function prettyStack(
  err: AppErr,
  parentStackLines: string[],
  isFirst: boolean,
  color: Record<string, string>,
) {
  const stackLines = err.stack?.split('\n') || [];
  let isFirstLine = true;
  let stack = stackLines
    .map((line, index) => {
      /** First line is the Err msg. */
      if (index === 0) {
        const [, errName, errMsg] =
          errMsgRe.exec(line) || [];
        const causeBy = isFirst
          ? ''
          : `${color.red}└──${color.reset} `;
        const data = Object.keys(err)
          .filter(
            (key) =>
              ![
                'code',
                'name',
                'args',
                'isOperational',
              ].includes(key),
          )
          .map((key) => {
            return (
              (err as any)[key] &&
              `\n\n  ${key}: ${JSON.stringify(
                (err as any)[key],
              )}`
            );
          })
          .filter(Boolean);
        const extra = data.length ? data : '';
        return `\n  ${causeBy}${color.bgRed}${errName}${color.reset}${color.gray}:${color.reset} ${errMsg}${extra}\n`;
      }
      /** We are removing AppErr method. */
      if (isFirst && index === 1) {
        return null;
      }
      const parsedLine = parseLine(line);
      if (parsedLine) {
        const { methodName, lineNumber, column, path } =
          parsedLine;
        /** We are ignoring NodeJS native errors. */
        if (path.startsWith('node:')) {
          return null;
        }
        /** We are removing duplicated lines. */
        if (parentStackLines.includes(line)) {
          return null;
        }
        /** We are replacing current directory. */
        const shortPath = path.replace(process.cwd(), '~');
        const filename = path.replace(filenameRe, '');
        const args =
          isFirstLine && err.args?.length
            ? `(${JSON.stringify(err.args).slice(1, -1)})`
            : '';
        isFirstLine = false;
        return `  ${color.gray}- ${color.yellow}${filename} ${color.green}${lineNumber} ${color.cyan}${methodName}${args}\n   ${color.gray}${shortPath}:${lineNumber}:${column}${color.reset}\n`;
      }
      return line;
    })
    .filter(Boolean)
    .join('\n');
  if (err.cause) {
    stack += prettyStack(
      err.cause as AppErr,
      stackLines,
      false,
      color,
    );
  }
  return stack;
}

const errCodeToName = {
  100: 'Continue',
  101: 'SwitchingProtocols',
  102: 'Processing' /** WebDAV; RFC 2518 */,
  103: 'Checkpoint',
  104: 'EarlyHints' /** RFC 8297 */,
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'NonAuthoritativeInformation' /** since HTTP/1.1 */,
  204: 'NoContent',
  205: 'ResetContent',
  206: 'PartialContent' /** RFC 7233 */,
  207: 'MultiStatus' /** WebDAV; RFC 4918 */,
  208: 'AlreadyReported' /** WebDAV; RFC 5842 */,
  218: 'ThisIsFine' /** Apache Web Server */,
  226: 'IMUsed' /** RFC 3229 */,
  300: 'MultipleChoices',
  301: 'MovedPermanently',
  302: 'Found' /** Previously "Moved temporarily" */,
  303: 'SeeOther' /** since HTTP/1.1 */,
  304: 'NotModified' /** RFC 7232 */,
  305: 'UseProxy' /** since HTTP/1.1 */,
  306: 'SwitchProxy',
  307: 'TemporaryRedirect' /** since HTTP/1.1 */,
  308: 'PermanentRedirect' /** RFC 7538 */,
  400: 'BadRequest',
  401: 'Unauthorized' /** RFC 7235 */,
  402: 'PaymentRequired',
  403: 'Forbidden',
  404: 'NotFound',
  405: 'MethodNotAllowed',
  406: 'NotAcceptable',
  407: 'ProxyAuthenticationRequired' /** RFC 7235 */,
  409: 'Conflict',
  410: 'Gone',
  411: 'LengthRequired',
  412: 'PreconditionFailed' /** RFC 7232 */,
  413: 'PayloadTooLarge' /** RFC 7231 */,
  414: 'URITooLong' /** RFC 7231 */,
  415: 'UnsupportedMediaType' /** RFC 7231 */,
  416: 'RangeNotSatisfiable' /** RFC 7233 */,
  417: 'ExpectationFailed',
  418: 'Teapot' /** RFC 2324, RFC 7168 */,
  419: 'PageExpired' /** Laravel Framework */,
  420: 'MethodFailure' /** Spring Framework */,
  421: 'EnhanceYourCalm' /** Twitter */,
  422: 'UnprocessableEntity' /** WebDAV; RFC 4918 */,
  423: 'Locked' /** WebDAV; RFC 4918 */,
  424: 'FailedDependency' /** WebDAV; RFC 4918 */,
  425: 'TooEarly' /** RFC 8470 */,
  426: 'UpgradeRequired',
  428: 'PreconditionRequired' /** RFC 6585 */,
  429: 'TooManyRequests' /** RFC 6585 */,
  431: 'RequestHeaderFieldsTooLarge' /** RFC 6585 */,
  432: 'MisdirectedRequest' /** RFC 7540 */,
  444: 'NoResponse' /** nginx */,
  449: 'RetryWith' /** IIS */,
  451: 'Redirect' /** IIS */,
  452: 'UnavailableForLegalReasons' /** RFC 7725 */,
  493: 'TokenRequired' /** Esri */,
  494: 'RequestHeaderTooLarge' /** nginx */,
  495: 'SSLCertificateError' /** nginx */,
  496: 'SSLCertificateRequired' /** nginx */,
  497: 'HTTPRequestSentToHTTPSPort' /** nginx */,
  498: 'InvalidToken' /** Esri */,
  499: 'ClientClosedRequest' /** nginx */,
  500: 'InternalServerError',
  501: 'NotImplemented',
  502: 'BadGateway',
  503: 'ServiceUnavailable',
  505: 'HTTPVersionNotSupported',
  506: 'VariantAlsoNegotiates' /** RFC 2295 */,
  507: 'InsufficientStorage' /** WebDAV; RFC 4918 */,
  508: 'LoopDetected' /** WebDAV; RFC 5842 */,
  509: 'BandwidthLimitExceeded' /** Apache Web Server/cPanel */,
  510: 'NotExtended' /** RFC 2774 */,
  511: 'NetworkAuthenticationRequired' /** RFC 6585 */,
  520: 'ServiceReturnedAnUnknownError' /** Cloudflare */,
  521: 'ServiceIsDown' /** Cloudflare */,
  523: 'OriginIsUnreachable' /** Cloudflare */,
  524: 'ATimeoutOccurred' /** Cloudflare */,
  525: 'SSLHandshakeFailed' /** Cloudflare */,
  526: 'InvalidSSLCertificate' /** Cloudflare */,
  527: 'RailgunError' /** Cloudflare */,
  529: 'IsOverloaded' /** Qualys in the SSLLabs */,
  530: 'IsFrozen' /** Pantheon web platform */,
  571: 'UnexpectedError' /** Custom */,
  572: 'CircuitSuspended' /** Custom */,
  574: 'StopPropagation' /** Custom */,
  575: 'Fail' /** Custom */,
  576: 'InvalidArgument' /** Custom */,
  577: 'ValidationFailed' /** Custom */,
  578: 'CircularDependencyDetected' /** Custom */,
} as const;

type ErrCode = keyof typeof errCodeToName;
type ErrName = typeof errCodeToName[ErrCode];
type CreateAppErr = ReturnType<typeof createAppErrCreator>;

const nameToErrCode = Object.fromEntries(
  Object.entries(errCodeToName).map(([key, value]) => [
    value,
    key as unknown,
  ]),
) as Record<ErrName, ErrCode>;

/** @alias nameToErrCode */
export const errCode = nameToErrCode;

export function createAppErrCreator(errCode: ErrCode) {
  return function (msg: string, opts: AppErrOpts = {}) {
    return Result.failure(new AppErr(errCode, msg, opts));
  };
}

export const appErr = Object.fromEntries(
  Object.entries(nameToErrCode).map(([name, errCode]) => {
    return [name, createAppErrCreator(errCode)];
  }),
) as Record<ErrName, CreateAppErr>;
