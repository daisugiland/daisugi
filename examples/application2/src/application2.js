import { createDaisugi } from '@daisugi/daisugi';
import { createOza } from '@daisugi/oza';
import { result } from '@daisugi/oumi';

const { sequenceOf } = createDaisugi();
const { createWebServer } = createOza();

function a(context) {
  console.log('PPPP', context);

  return context;
}

function b(context) {
  context.response.body = 'hellooo';

  return context;
}

await sequenceOf([createWebServer(3001), a, b])();

console.log('web server started.');
