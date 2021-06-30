import { daisugi } from '@daisugi/daisugi';
import { oza } from '@daisugi/oza';
import { result, withRetry } from '@daisugi/oumi';

const { sequenceOf } = daisugi();
const { createWebServer } = oza();

function cpuIntensiveTask(baseNumber) {
  let r = 0;

  for (let i = Math.pow(baseNumber, 7); i >= 0; i--) {
    r += Math.atan(i) * Math.tan(i);
  }
}

async function api() {
  cpuIntensiveTask(3);

  if (Math.random() > 0.8) {
    return result.ok('Ok');
  }

  return result.fail('Fail');
}

const apiWithRetry = withRetry(api);

async function controller(context) {
  const response = await apiWithRetry();
  const body = response.isSuccess
    ? response.value
    : response.error;

  context.response.body = body;

  return context;
}

try {
  await sequenceOf([createWebServer(3001), controller])();

  console.log('Started web server.');
} catch (error) {
  console.log(error);

  process.exit();
}
