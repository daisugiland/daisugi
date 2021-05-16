import { daisugi } from './daisugi';
import { kyoto } from './kyoto';

const { compose } = daisugi();
const { server, get } = kyoto();

process.on('SIGINT', () => {
  process.exit();
});

function page(context) {
  context.res.writeHead(200);

  return 'hello';
}

compose([server(3001), get('/test'), page])();
