import assert from 'node:assert';
import { it } from 'mocha';
import { Result } from '@daisugi/anzen';

import { withRetry } from '../with_retry.js';

it('should return expected response', async () => {
  async function fn() {
    return Result.success('ok');
  }

  const fnWithRetry = withRetry(fn);

  const response = await fnWithRetry();

  assert.strictEqual(response.getValue(), 'ok');
});
