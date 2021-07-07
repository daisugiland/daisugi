const { daisugi } = require('@daisugi/daisugi');
const { oza } = require('@daisugi/oza');
const { result, withRetry } = require('@daisugi/oumi');

const { sequenceOf } = daisugi();
const { createWebServer } = oza();

function cpuIntensiveTask(baseNumber) {
  let r = 0;

  for (let i = baseNumber ** 7; i >= 0; i--) {
    r += Math.atan(i) * Math.tan(i);
  }
}

async function api() {
  cpuIntensiveTask(3);

  // 20%
  if (Math.random() < 0.2) {
    return result.ok('Ok.');
  }

  return result.fail('Fail.');
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

(async () => {
  try {
    await sequenceOf([createWebServer(3001), controller])();

    console.log('Started web server.');
  } catch (error) {
    console.log(error);

    process.exit();
  }
})();
