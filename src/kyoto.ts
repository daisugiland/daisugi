import * as http from 'http';
import * as querystring from 'querystring';
import { match } from 'path-to-regexp';

import { stopWith, Toolkit } from './daisugi';

export interface Context {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  request: {
    url: string;
    matchedPath: string;
    params: Record<string, any>;
    headers: Record<string, any>;
    query: Record<string, any>;
    payload: Record<string, any>;
    method: string;
  };
  response: {
    statusCode: number;
    output: string;
  };
}

function createServer(port = 3000) {
  function handler(toolkit: Toolkit) {
    const server = http.createServer((req, res) => {
      const queryStartPosition = req.url.indexOf('?');
      const query = querystring.parse(
        queryStartPosition > -1
          ? req.url.slice(queryStartPosition + 1)
          : '',
      );

      const context: Context = {
        req,
        res,
        request: {
          url: req.url,
          matchedPath: null,
          params: {},
          headers: req.headers,
          query,
          payload: {},
          method: req.method,
        },
        response: {
          statusCode: 200,
          output: null,
        },
      };

      toolkit.nextWith(context);

      res.statusCode = context.response.statusCode;
      res.end(context.response.output);
    });

    server.listen(port, () => {
      console.log('Server started');
    });
  }

  handler.meta = {
    injectToolkit: true,
  };

  return handler;
}

function createRouteHandler(path: string, method: string) {
  const matchFn = match(path, {
    decode: decodeURIComponent,
  });

  return function (context: Context) {
    if (context.request.matchedPath) {
      return stopWith(context);
    }

    if (context.request.method !== method) {
      return stopWith(context);
    }

    const matchedUrl = matchFn(context.request.url);

    if (!matchedUrl) {
      return stopWith(context);
    }

    // @ts-ignore
    context.request.params = matchedUrl.params;
    context.request.matchedPath = path;
    context.response.statusCode = 200;

    return context;
  };
}

function get(path: string) {
  return createRouteHandler(path, 'GET');
}

function post(path: string) {
  return createRouteHandler(path, 'POST');
}

function notFound(context: Context) {
  if (context.request.matchedPath) {
    return stopWith(context);
  }

  context.response.statusCode = 404;

  return context;
}

export function kyoto() {
  return {
    createServer,
    get,
    post,
    notFound,
  };
}
