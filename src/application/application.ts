import { daisugi } from '../daisugi/daisugi';
import { oza, Context } from '../oza/oza';

import { filePage } from './filePage';

const { sequenceOf } = daisugi();
const {
  createWebServer,
  get,
  notFound,
  validate,
  captureError,
  compress,
  setCache,
  setInfiniteCache,
  openAPIStatics,
} = oza();

process.on('SIGINT', () => {
  process.exit();
});

function notFoundPage(context: Context) {
  context.response.body = 'not found';

  return context;
}

function errorPage(context: Context) {
  context.response.body = 'error';

  return context;
}

(async () => {
  await sequenceOf([
    createWebServer(3001),
    captureError(sequenceOf([errorPage])),
    ...openAPIStatics(sequenceOf, get),
    filePage(daisugi, oza),
    sequenceOf([notFound, notFoundPage]),
  ])();

  console.log('Server started');
})();
