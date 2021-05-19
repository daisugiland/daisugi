import * as joi from 'joi';

import { daisugi } from './daisugi';
import { kyoto, Context } from './kyoto/kyoto';

const { compose, sequenceOf } = daisugi();
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

function errorPage() {
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

compose([
  createServer(3001),
  sequenceOf([get('/test/:id'), validate(schema), page]),
  sequenceOf([get('/error'), errorPage]),
  sequenceOf([notFound, notFoundPage]),
])();
