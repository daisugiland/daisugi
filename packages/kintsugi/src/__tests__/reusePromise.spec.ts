import { reusePromise } from '../reusePromise.js';
import { AsyncFn } from '../types.js';
import { waitFor } from '../waitFor.js';

async function reuseResult() {
  await waitFor(1);

  return Date.now();
}

describe('reusePromise', () => {
  it('should reuse the same promise if the current one still pending', () => {
    const reusedWaitFor = reusePromise(waitFor as AsyncFn);

    const promiseA = reusedWaitFor(1);
    const promiseB = reusedWaitFor(1);

    expect(promiseA).toStrictEqual(promiseB);
  });

  it('should creates new promise per each set of arguments', () => {
    const reusedWaitFor = reusePromise(waitFor as AsyncFn);

    const promiseA = reusedWaitFor(1);
    const promiseB = reusedWaitFor(2);

    expect(promiseA).not.toBe(promiseB);
  });

  it('should reuse the same returned value if the current one was resolve', async () => {
    const reusedResult = reusePromise(reuseResult);
    let resultA, resultB;

    reusedResult(1).then((result) => {
      resultA = result;
      return result;
    });

    await reusedResult(1).then((result) => {
      resultB = result;
      return result;
    });

    expect(resultA).toBe(resultB);
  });

  it('asks for a new promise if previous one was resolve', async () => {
    const reusedResult = reusePromise(reuseResult);

    const resultA = await reusedResult(1);
    const resultB = await reusedResult(1);

    expect(resultA).not.toBe(resultB);
  });
});
