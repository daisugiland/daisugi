import { callWithRetry, result } from '../oumi';

describe('callWithRetry', () => {
  it('should 1', async () => {
    const a = callWithRetry(function () {
      return result.ok('result');
    });

    const resultA = await a();

    expect(resultA.value).toBe('result');
  });

  fit('should 2', async () => {
    let index = 0;
    const a = callWithRetry(function () {
      index++;

      return result.fail('bad result');
    });

    const resultA = await a();

    expect(resultA.error).toBe('bad result');
    expect(index).toBe(6);
  });
});
