import assert from 'node:assert';
import { describe, it } from 'mocha';

import { reusePromise } from '../reuse_promise.js';
import type { AsyncFn } from '../types.js';
import { waitFor } from '../wait_for.js';

async function reuseResult(arg1: number, arg2: number) {
  await waitFor(1);

  return `${Date.now()}${arg1}${arg2}`;
}

describe('reusePromise', () => {
  it('should reuse the same promise if the current one still pending', () => {
    const reusedWaitFor = reusePromise(waitFor as AsyncFn);

    const promiseA = reusedWaitFor(1);
    const promiseB = reusedWaitFor(1);

    assert.deepEqual(promiseA, promiseB);
  });

  it('should creates new promise per each set of arguments', () => {
    const reusedWaitFor = reusePromise(waitFor as AsyncFn);

    const promiseA = reusedWaitFor(1, 1);
    const promiseB = reusedWaitFor(2, 2);

    assert.notStrictEqual(promiseA, promiseB);
  });

  it('should reuse the same returned value if the current one was resolve', async () => {
    const reusedResult = reusePromise(reuseResult);
    let resultA;
    let resultB;

    reusedResult(1, 1).then((result) => {
      resultA = result;
      return result;
    });

    await reusedResult(1, 1).then((result) => {
      resultB = result;
      return result;
    });

    assert.strictEqual(resultA, resultB);
  });

  it('asks for a new promise if previous one was resolve', async () => {
    const reusedResult = reusePromise(reuseResult);

    const resultA = await reusedResult(1, 1);
    const resultB = await reusedResult(1, 1);

    assert.notStrictEqual(resultA, resultB);
  });
});
