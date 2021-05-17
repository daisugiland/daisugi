import { daisugi } from './daisugi';
import { kyoto, Context } from './kyoto';

const { compose } = daisugi();
const { createServer, get, notFound } = kyoto();

process.on('SIGINT', () => {
  process.exit();
});

function helloPage(context: Context) {
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

compose([
  createServer(3001),
  compose([get('/test/:id'), helloPage]),
  compose([get('/error'), errorPage]),
  compose([notFound, notFoundPage]),
])();
