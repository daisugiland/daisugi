import { withRetry, result } from '../oumi';

describe('withRetry', () => {
  it('should return expected result if the promise resolves', async () => {
    const a = withRetry(function () {
      return result.ok('result');
    });

    const resultA = await a();

    expect(resultA.value).toBe('result');
  });

  fit('should retry expected times when promise fails', async () => {
    let index = 0;
    const a = withRetry(function () {
      index++;

      return result.fail('bad result');
    });

    const resultA = await a();

    expect(resultA.error).toBe('bad result');
    expect(index).toBe(6);
  });
});
