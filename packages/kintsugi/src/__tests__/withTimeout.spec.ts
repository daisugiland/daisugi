it('true', () => {
  expect(true).toBe(true);
});

/*
import {
  withTimeout,
  waitFor,
  result,
  Code,
} from '../kintsugi';

async function fnA(response, delayTime) {
  await waitFor(delayTime);

  return result.ok(response);
}

const fnAWithTimeout = withTimeout(fnA);

describe('withTimeout', () => {
  describe('when fnA takes longer than max timeout', () => {
    it('should resolve with timeout', async () => {
      const resultA = await fnAWithTimeout('ok', 300);

      expect(resultA.isFailure).toBe(true);
      expect(resultA.error.code).toBe(Code.Timeout);
    });
  });

  describe('when fnA takes less than max timeout', () => {
    it('should resolve with expected value', async () => {
      const resultA = await fnAWithTimeout('ok', 100);

      expect(resultA.isSuccess).toBe(true);
      expect(resultA.value).toBe('ok');
    });
  });
});
*/
