const { daisugi } = require('@daisugi/daisugi');
const { oza } = require('@daisugi/oza');
const {
  result,
  withRetry,
  waitFor,
  reusePromise,
  withTimeout,
  createWithCircuitBreaker,
} = require('@daisugi/oumi');
const { vasa } = require('@daisugi/vasa');

const { sequenceOf } = daisugi();
const { createWebServer } = oza();

const withCircuitBreaker = createWithCircuitBreaker();

function cpuIntensiveTask(baseNumber) {
  let r = 0;

  for (let i = baseNumber ** 7; i >= 0; i--) {
    r += Math.atan(i) * Math.tan(i);
  }
}

async function api() {
  cpuIntensiveTask(6);

  // await waitFor(1000);

  // 20%
  if (Math.random() < 0.2) {
    return result.ok('Ok.');
  }

  return result.fail('Fail.');
}

const apiWithRetry = withCircuitBreaker(api);

async function controller(context) {
  const response = await apiWithRetry();

  // console.log(response.error);

  const body = response.isSuccess
    ? response.value
    : JSON.stringify(response.error);

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
