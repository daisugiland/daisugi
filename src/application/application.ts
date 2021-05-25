import * as joi from 'joi';

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
} = oza();

process.on('SIGINT', () => {
  process.exit();
});

function testPage(context: Context) {
  context.response.body = 'hello page';

  return context;
}

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

function helloPage(context: Context) {
  context.response.body = 'hello';

  return context;
}

function failPage(context: Context) {
  context.response.body = 'error';

  return context;
}

(async () => {
  await sq([
    createWebServer(3001),
    captureError(sq([failPage])),
    sq([
      get('/test/:id'),
      validate(schema),
      testPage,
      // compress(),
    ]),
    sq([get('/error'), errorPage]),
    sq([get('/hello'), helloPage]),
    sq([notFound, notFoundPage]),
  ])();

  console.log('Server started');
})();
