import { withRetry } from '../withRetry';
import { result } from '../result';

it('should return expected response', async () => {
  function fn() {
    return result.ok('ok');
  }

  const fnWithRetry = withRetry(fn);

  const response = await fnWithRetry();

  expect(response.value).toEqual('ok');
});
