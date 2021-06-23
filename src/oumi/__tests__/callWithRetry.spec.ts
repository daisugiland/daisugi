import { callWithRetry, result } from '../oumi';

describe('callWithRetry', () => {
  it('should 1', () => {
    const a = callWithRetry(function () {
      return result.ok('result');
    });

    const resultA = a();

    expect(resultA.value).toBe('result');
  });

  it('should 2', () => {
    let index = 0;
    const a = callWithRetry(function () {
      index++;

      return result.fail('bad result');
    });

    const resultA = a();

    expect(resultA.error).toBe('bad result');
    expect(index).toBe(5);
  });
});
