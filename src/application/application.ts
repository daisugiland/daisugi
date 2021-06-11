import * as joi from 'joi';
import * as path from 'path';

import { daisugi } from '../daisugi/daisugi';
import { oza, Context } from '../oza/oza';
import { openAPIStatics } from '../oza/openAPI';

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
  context.sendFile(path.join(__dirname, './index.html'));

  return context;
}

(async () => {
  await sq([
    createWebServer(3001),
    captureError(sq([failPage])),
    ...openAPIStatics(sq, get),
    sq([
      get('/file/:id'),
      validate(schema),
      file,
      // page,
      // setCache(),
      // compress(),
    ]),
    sq([get('/error'), errorPage]),
    sq([notFound, notFoundPage]),
  ])();
})();

console.log('Server started');
