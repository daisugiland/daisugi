export interface AyamariOpts {
  levelValue?: number;
  injectStack?: boolean;
}

export interface AyamariErrOpts {
  cause?: AyamariErr | Error;
  // data?: any;
  // args?: IArguments;
  injectStack?: boolean;
  levelValue?: number;
}

export interface AyamariErr {
  name: string;
  message: string;
  code: AyamariErrCode;
  stack: string;
  cause: AyamariErr | Error | null | undefined;
  // args: unknown[] | null | undefined;
  // data: any | null | undefined;
  levelValue?: number;
}

export type AyamariErrName =
  keyof typeof Ayamari['nameToErrCode'];
export type AyamariErrCode = number;
export type AyamariCreateErr = ReturnType<
  typeof Ayamari.prototype.createErrCreator
>;
export type AyamariErr2 = Record<
  AyamariErrName,
  AyamariCreateErr
>;

export class Ayamari {
  static level = {
    off: 100,
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10,
  };
  static nameToErrCode = {
    Continue: 100,
    SwitchingProtocols: 101,
    Processing: 102 /** WebDAV; RFC 2518 */,
    Checkpoint: 103,
    EarlyHints: 104 /** RFC 8297 */,
    OK: 200,
    Created: 201,
    Accepted: 202,
    NonAuthoritativeInformation: 203 /** since HTTP/1.1 */,
    NoContent: 204,
    ResetContent: 205,
    PartialContent: 206 /** RFC 7233 */,
    MultiStatus: 207 /** WebDAV; RFC 4918 */,
    AlreadyReported: 208 /** WebDAV; RFC 5842 */,
    ThisIsFine: 218 /** Apache Web Server */,
    IMUsed: 226 /** RFC 3229 */,
    MultipleChoices: 300,
    MovedPermanently: 301,
    Found: 302 /** Previously "Moved temporarily" */,
    SeeOther: 303 /** since HTTP/1.1 */,
    NotModified: 304 /** RFC 7232 */,
    UseProxy: 305 /** since HTTP/1.1 */,
    SwitchProxy: 306,
    TemporaryRedirect: 307 /** since HTTP/1.1 */,
    PermanentRedirect: 308 /** RFC 7538 */,
    BadRequest: 400,
    Unauthorized: 401 /** RFC 7235 */,
    PaymentRequired: 402,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    NotAcceptable: 406,
    ProxyAuthenticationRequired: 407 /** RFC 7235 */,
    Conflict: 409,
    Gone: 410,
    LengthRequired: 411,
    PreconditionFailed: 412 /** RFC 7232 */,
    PayloadTooLarge: 413 /** RFC 7231 */,
    URITooLong: 414 /** RFC 7231 */,
    UnsupportedMediaType: 415 /** RFC 7231 */,
    RangeNotSatisfiable: 416 /** RFC 7233 */,
    ExpectationFailed: 417,
    Teapot: 418 /** RFC 2324, RFC 7168 */,
    PageExpired: 419 /** Laravel Framework */,
    MethodFailure: 420 /** Spring Framework */,
    EnhanceYourCalm: 421 /** Twitter */,
    UnprocessableEntity: 422 /** WebDAV; RFC 4918 */,
    Locked: 423 /** WebDAV; RFC 4918 */,
    FailedDependency: 424 /** WebDAV; RFC 4918 */,
    TooEarly: 425 /** RFC 8470 */,
    UpgradeRequired: 426,
    PreconditionRequired: 428 /** RFC 6585 */,
    TooManyRequests: 429 /** RFC 6585 */,
    RequestHeaderFieldsTooLarge: 431 /** RFC 6585 */,
    MisdirectedRequest: 432 /** RFC 7540 */,
    NoResponse: 444 /** nginx */,
    RetryWith: 449 /** IIS */,
    Redirect: 451 /** IIS */,
    UnavailableForLegalReasons: 452 /** RFC 7725 */,
    TokenRequired: 493 /** Esri */,
    RequestHeaderTooLarge: 494 /** nginx */,
    SSLCertificateError: 495 /** nginx */,
    SSLCertificateRequired: 496 /** nginx */,
    HTTPRequestSentToHTTPSPort: 497 /** nginx */,
    InvalidToken: 498 /** Esri */,
    ClientClosedRequest: 499 /** nginx */,
    InternalServerError: 500,
    NotImplemented: 501,
    BadGateway: 502,
    ServiceUnavailable: 503,
    HTTPVersionNotSupported: 505,
    VariantAlsoNegotiates: 506 /** RFC 2295 */,
    InsufficientStorage: 507 /** WebDAV; RFC 4918 */,
    LoopDetected: 508 /** WebDAV; RFC 5842 */,
    BandwidthLimitExceeded: 509 /** Apache Web Server/cPanel */,
    NotExtended: 510 /** RFC 2774 */,
    NetworkAuthenticationRequired: 511 /** RFC 6585 */,
    ServiceReturnedAnUnknownError: 520 /** Cloudflare */,
    ServiceIsDown: 521 /** Cloudflare */,
    OriginIsUnreachable: 523 /** Cloudflare */,
    ATimeoutOccurred: 524 /** Cloudflare */,
    SSLHandshakeFailed: 525 /** Cloudflare */,
    InvalidSSLCertificate: 526 /** Cloudflare */,
    RailgunError: 527 /** Cloudflare */,
    IsOverloaded: 529 /** Qualys in the SSLLabs */,
    IsFrozen: 530 /** Pantheon web platform */,
    UnexpectedError: 571 /** Custom */,
    CircuitSuspended: 572 /** Custom */,
    StopPropagation: 574 /** Custom */,
    Fail: 575 /** Custom */,
    InvalidArgument: 576 /** Custom */,
    ValidationFailed: 577 /** Custom */,
    CircularDependencyDetected: 578 /** Custom */,
  };
  createErr: AyamariErr2;
  #injectStack = false;
  #levelValue = Ayamari.level.info;

  constructor(opts: AyamariOpts = {}) {
    if (opts.injectStack !== undefined) {
      this.#injectStack = opts.injectStack;
    }
    if (opts.levelValue !== undefined) {
      this.#levelValue = opts.levelValue;
    }
    this.createErr = Object.entries(
      Ayamari.nameToErrCode,
    ).reduce((acc, [errName, errCode]) => {
      acc[errName as AyamariErrName] =
        this.createErrCreator(errName, errCode);
      return acc;
    }, {} as AyamariErr2);
  }

  createErrCreator(
    errName: string,
    errCode: AyamariErrCode,
  ) {
    const name = `${errName} [${errCode}]`;
    const createErr = (
      msg: string,
      opts: AyamariErrOpts = {},
    ) => {
      const err: AyamariErr = {
        name,
        message: msg,
        code: errCode,
        stack: opts.cause?.stack || 'No stack',
        cause: opts.cause || null,
        // data: opts.data ?? null,
        // args: opts.args ? Array.from(opts.args) : null,
        levelValue: opts.levelValue ?? this.#levelValue,
      };
      if (opts.injectStack || this.#injectStack) {
        Error.captureStackTrace(err, createErr);
      }
      return err;
    };
    return createErr;
  }
}
