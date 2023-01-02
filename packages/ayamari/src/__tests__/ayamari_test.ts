import assert from 'node:assert/strict';
import { test } from 'node:test';

test('Ayamari', async (t) => {
  await t.test('success', async () => {
    await t.test(
      'should return expected value',
      async () => {
        assert.equal(true, true);
      },
    );
  });
});
