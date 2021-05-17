import * as http from 'http';
import { match } from 'path-to-regexp';

import { stopWith } from './daisugi';

export interface Context {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  request: {
    url: string;
    matchedPath: string;
    params: Record<string, any>;
  };
  response: {
    statusCode: number;
    output: string;
  };
}

function createServer(port = 3000) {
  function handler(toolkit) {
    const server = http.createServer((req, res) => {
      const context: Context = {
        req,
        res,
        request: {
          url: req.url,
          matchedPath: null,
          params: {},
        },
        response: {
          statusCode: 200,
          output: null,
        },
      };

      toolkit.nextWith(context);

      res.writeHead(context.response.statusCode);
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

function get(path: string) {
  const matchFn = match(path, {
    decode: decodeURIComponent,
  });

  return function (context: Context) {
    if (context.request.matchedPath) {
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
    notFound,
  };
}
