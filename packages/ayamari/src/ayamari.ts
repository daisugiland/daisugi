import { Result } from '@daisugi/anzen';

interface AppErrOpts {
  cause?: Error;
  props?: Record<string, any>;
  args?: Parameters<any>;
}

export class AppErr extends Error {
  code: ErrCode;
  name: string;
  props: Record<string, any> = {};
  args: any[] = [];

  constructor(
    errCode: ErrCode,
    msg: string,
    opts: AppErrOpts = {},
  ) {
    super(`[${errCode}] ${msg}`, opts);
    Object.setPrototypeOf(this, AppErr.prototype);
    this.code = errCode;
    this.name = errCodeToName[errCode];
    if (opts.props) {
      this.props = opts.props;
    }
    if (opts.args) {
      this.args = Array.from(opts.args);
    }
  }

  prettyStack() {}
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
} as const;

type ErrCode = keyof typeof errCodeToName;

const nameToErrCode = Object.fromEntries(
  Object.entries(errCodeToName).map(([key, value]) => [
    value,
    key as unknown as ErrCode,
  ]),
);

/** @alias nameToErrCode */
export const errCode = nameToErrCode;

export function createAppErr(errCode: ErrCode) {
  return function (msg: string, opts: AppErrOpts) {
    return Result.failure(new AppErr(errCode, msg, opts));
  };
}

export const appErr = Object.fromEntries(
  Object.entries(nameToErrCode).map(([name, errCode]) => {
    return [name, createAppErr(errCode)];
  }),
);
