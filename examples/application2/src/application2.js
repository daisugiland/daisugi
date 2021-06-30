import { createDaisugi } from '@daisugi/daisugi';
import { createOza } from '@daisugi/oza';
import { waitFor, reusePromise } from '@daisugi/oumi';

const { sequenceOf } = createDaisugi();
const { createWebServer } = createOza();

function a(context) {
  return context;
}

let runs = 0;

async function intensiveTask() {
  runs++;
  await waitFor(300);
}

const reusedIntensiveTask = reusePromise(intensiveTask);

async function b(context) {
  await reusedIntensiveTask();

  context.response.body = 'hello';

  console.log(runs);

  return context;
}

await sequenceOf([createWebServer(3001), a, b])();

console.log('started web server.');
