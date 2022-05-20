import assert from 'node:assert';
import { it } from 'mocha';

import { withRetry } from '../with_retry.js';
import { result } from '../result.js';

it(
  'should return expected response',
  async () => {
    async function fn() {
      return result.ok('ok');
    }

    const fnWithRetry = withRetry(fn);

    const response = await fnWithRetry();

    assert.strictEqual(response.value, 'ok');
  },
);
