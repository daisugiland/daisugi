import * as http from 'http';
import * as querystring from 'querystring';
import * as fs from 'fs';
import * as mime from 'mime';
import { Stream } from 'stream';
import { Toolkit } from '@daisugi/daisugi';

import { compress } from './compress';
import { openAPIStatics } from './openAPI';
import { setCache, setInfiniteCache } from './cache';
import {
  get,
  post,
  put,
  patch,
  routeDelete,
  all,
  notFound,
} from './router';
import { validate } from './validate';
import { captureError } from './captureError';
import { isStream } from './utils';
import { Context } from './types';
import { streamToBuffer } from './streamToBuffer';

export { Context as Context };

function getQuerystring(
  querystringStartPosition: number,
  rawRequest: http.IncomingMessage,
) {
  if (querystringStartPosition > -1) {
    return querystring.parse(
      rawRequest.url.slice(querystringStartPosition + 1),
    );
  }

  return {};
}

function getUrl(
  querystringStartPosition: number,
  rawRequest: http.IncomingMessage,
) {
  if (querystringStartPosition > -1) {
    return rawRequest.url.slice(
      0,
      querystringStartPosition,
    );
  }

  return rawRequest.url;
}

function deferredPromise() {
  let resolve;
  let reject;

  const promise = new Promise(
    (privateResolve, privateReject) => {
      resolve = privateResolve;
      reject = privateReject;
    },
  );

  return {
    resolve,
    reject,
    promise,
  };
}

function sendFile(path: string) {
  const fileStream = fs.createReadStream(path);
  const contentType = mime.getType(path);

  if (
    !this.response.headers['content-type'] &&
    contentType
  ) {
    // https://datatracker.ietf.org/doc/html/rfc7159#section-8.1 JSON is UTF-8 by default.
    // https://www.w3.org/International/questions/qa-css-charset.en.html JS and CSS uses same charset as in HTML.

    this.response.headers['content-type'] =
      contentType === 'text/html'
        ? 'text/html; charset=UTF-8'
        : contentType;
  }

  this.response.body = fileStream;
}

function createContext(
  rawRequest: http.IncomingMessage,
  rawResponse: http.ServerResponse,
): Context {
  const querystringStartPosition =
    rawRequest.url.indexOf('?');

  return {
    rawRequest,
    rawResponse,
    request: {
      url: getUrl(querystringStartPosition, rawRequest),
      matchedRoutePath: null,
      params: {},
      headers: rawRequest.headers,
      querystring: getQuerystring(
        querystringStartPosition,
        rawRequest,
      ),
      body: {},
      method: rawRequest.method,
    },
    response: {
      statusCode: 200,
      body: null,
      headers: {
        'last-modified': new Date().toUTCString(),
      },
    },
    sendFile,
  };
}

function createWebServer(port = 3000) {
  // TODO: test timeout error.
  const connectionTimeout = 30000; // 30s
  const keepAliveTimeout = 5000; // 5s default NodeJS
  // const bodyLimit = 1024 * 1024; // 1 MB
  // TODO: limit body.

  let totalRequests = 0;

  function handler(toolkit: Toolkit) {
    const isStarted = deferredPromise();

    const server = http.createServer(
      async (rawRequest, rawResponse) => {
        console.log(++totalRequests);

        const context = createContext(
          rawRequest,
          rawResponse,
        );

        await toolkit.nextWith(context);

        let body = context.response.body;

        if (body) {
          if (isStream(body)) {
            // TODO: Use then here.
            body = await streamToBuffer(body as Stream);

            context.response.headers['content-length'] =
              body.length;
          }

          if (typeof body === 'string') {
            context.response.headers['content-length'] =
              Buffer.byteLength(body);
          }

          if (!context.response.headers['content-type']) {
            context.response.headers['content-type'] =
              'text/html; charset=UTF-8';
          }
        }

        rawResponse.statusCode =
          context.response.statusCode;

        Object.entries(context.response.headers).forEach(
          ([key, value]) => {
            rawResponse.setHeader(key, value);
          },
        );

        // Maybe introduce short circuit when method is HEAD.
        if (!body) {
          rawResponse.end();
          return;
        }

        rawResponse.end(body);
      },
    );

    // @ts-ignore
    server.setTimeout(connectionTimeout, (socket) => {
      // TODO: Log timeout.
      console.log('Request timeout', socket.address());
    });
    server.keepAliveTimeout = keepAliveTimeout;

    server.listen(port, () => {
      isStarted.resolve();
    });

    return isStarted.promise;
  }

  handler.meta = {
    injectToolkit: true,
  };

  return handler;
}

export function createOza() {
  return {
    createWebServer,
    get,
    post,
    put,
    patch,
    routeDelete,
    all,
    notFound,
    validate,
    captureError,
    compress,
    setCache,
    setInfiniteCache,
    openAPIStatics,
  };
}
