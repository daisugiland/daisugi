import * as joi from 'joi';

import { daisugi, Toolkit } from './daisugi';
import { kyoto, Context } from './kyoto/kyoto';

const { compose: cp, sequenceOf: sq } = daisugi();
const { createServer, get, notFound, validate } = kyoto();

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

function capture(context: Context, toolkit: Toolkit) {
  try {
    toolkit.next;
  } catch (error) {
    context.response.output = 'error';
  } finally {
    return context;
  }
}

capture.meta = {
  injectToolkit: true,
};

function helloPage(context: Context) {
  context.response.output = 'hello';

  return context;
}

cp([
  createServer(3001),
  capture,
  // sq([get('/test/:id'), /* validate(schema),*/ page]),
  sq([get('/error'), errorPage]),
  // sq([get('/hello'), helloPage]),
  // sq([notFound, notFoundPage]),
])();
