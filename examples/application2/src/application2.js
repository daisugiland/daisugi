import { createDaisugi } from '@daisugi/daisugi';
import { createOza } from '@daisugi/oza';
import { waitFor, reusePromise } from '@daisugi/oumi';

const { sequenceOf } = createDaisugi();
const { createWebServer } = createOza();

function a(context) {
  return context;
}

async function intensiveTask() {
  await waitFor(6000);
}

const reusedIntensiveTask = reusePromise(intensiveTask);

async function b(context) {
  await reusedIntensiveTask('a');

  context.response.body = 'hello';

  return context;
}

await sequenceOf([createWebServer(3001), a, b])();

console.log('started web server.');
