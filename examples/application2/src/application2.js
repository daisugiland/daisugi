import { createDaisugi } from '@daisugi/daisugi';
import { createOza } from '@daisugi/oza';
import { result } from '@daisugi/oumi';

const { sequenceOf } = createDaisugi();
const { createWebServer } = createOza();

function a(context) {
  return context;
}

function b(context) {
  context.response.body = 'hello';

  return context;
}

await sequenceOf([createWebServer(3001), a, b])();

console.log('started web server.');
