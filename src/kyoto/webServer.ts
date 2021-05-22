import * as http from 'http';
import * as querystring from 'querystring';

import { Toolkit } from '../daisugi/daisugi';
import { Context } from './types';

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

export function createWebServer(port = 3000) {
  function handler(toolkit: Toolkit) {
    const server = http.createServer(
      (rawRequest, rawResponse) => {
        const querystringStartPosition =
          rawRequest.url.indexOf('?');

        const context: Context = {
          rawRequest,
          rawResponse,
          request: {
            url: getUrl(
              querystringStartPosition,
              rawRequest,
            ),
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
            output: null,
          },
        };

        toolkit.nextWith(context);

        rawResponse.statusCode =
          context.response.statusCode;
        rawResponse.end(context.response.output);
      },
    );

    server.listen(port, () => {
      console.log('Server started');
    });
  }

  handler.meta = {
    injectToolkit: true,
  };

  return handler;
}
