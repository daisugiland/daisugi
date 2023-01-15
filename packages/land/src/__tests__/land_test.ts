import assert from 'node:assert/strict';
import { test } from 'node:test';

test('Land', async (t) => {
  await t.test('success', async (t) => {
    await t.test(
      'should return expected value',
      async () => {
        assert.equal(true, true);
      },
    );
  });
});
