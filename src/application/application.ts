import * as joi from 'joi';

import { daisugi } from '../daisugi/daisugi';
import { kyoto, Context } from '../kyoto/kyoto';

const { entrySequenceOf: esq, sequenceOf: sq } = daisugi();
const {
  createWebServer,
  get,
  notFound,
  validate,
  captureError,
} = kyoto();

process.on('SIGINT', () => {
  process.exit();
});

function page(context: Context) {
  context.response.output = 'hello page';

  return context;
}

function notFoundPage(context: Context) {
  context.response.output = 'not found';

  return context;
}

function errorPage(context: Context) {
  context.response.output = 'error originated here';

  throw new Error('error page');
}

const schema = {
  params: {
    id: joi.string().required(),
  },
  querystring: {
    q: joi
      .string()
      .required()
      .default('*')
      .example('*')
      .description(
        "Search term, if you don't want to filter, just use '*'",
      ),
  },
};

function helloPage(context: Context) {
  context.response.output = 'hello';

  return context;
}

function failPage(context: Context) {
  context.response.output = 'error';

  return context;
}

(async () => {
  await esq([
    createWebServer(3001),
    captureError(sq([failPage])),
    sq([get('/test/:id'), validate(schema), page]),
    sq([get('/error'), errorPage]),
    sq([get('/hello'), helloPage]),
    sq([notFound, notFoundPage]),
  ])();

  console.log('Server started');
})();
