import * as joi from 'joi';
import { getAbsoluteFSPath } from 'swagger-ui-dist';
import * as path from 'path';

import { daisugi } from '../daisugi/daisugi';
import { oza, Context } from '../oza/oza';

const { sequenceOf: sq } = daisugi();
const {
  createWebServer,
  get,
  notFound,
  validate,
  captureError,
  compress,
  setCache,
  setInfiniteCache,
} = oza();

process.on('SIGINT', () => {
  process.exit();
});

function notFoundPage(context: Context) {
  context.response.body = 'not found';

  return context;
}

function errorPage(context: Context) {
  context.response.body = 'error originated here';

  throw new Error('error page');
}

const schema = {
  params: {
    id: joi.string().required(),
  },
  querystring: {
    q: joi
      .string()
      .optional()
      .default('*')
      .example('*')
      .description(
        "Search term, if you don't want to filter, just use '*'",
      ),
  },
};

function failPage(context: Context) {
  context.response.body = 'error';

  return context;
}

function file(context: Context) {
  const url = path.join(__dirname, './index.html');
  context.sendFile(url);

  // console.log(getAbsoluteFSPath());
  // context.sendFile(getAbsoluteFSPath());

  return context;
}

function page(context: Context) {
  context.response.body = 'hello';

  return context;
}

(async () => {
  await sq([
    createWebServer(3001),
    captureError(sq([failPage])),
    sq([
      get('/file/:id'),
      validate(schema),
      file,
      // page,
      // setCache(),
      compress(),
    ]),
    sq([get('/error'), errorPage]),
    sq([notFound, notFoundPage]),
  ])();
})();

console.log('Server started');
