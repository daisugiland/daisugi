import * as http from 'http';
import { match } from 'path-to-regexp';

interface Context {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  request: {
    url: string;
  };
}

function server(port = 3000) {
  function handler(toolkit) {
    const server = http.createServer((req, res) => {
      const context: Context = {
        req,
        res,
        request: {
          url: req.url,
        },
      };

      const output = toolkit.nextWith(context);

      res.end(output);
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
    const matchedUrl = matchFn(context.request.url);

    console.log('LLLL', matchedUrl);

    return context;
  };
}

export function kyoto() {
  return {
    server,
    get,
  };
}
