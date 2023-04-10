import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Code } from '../code.js';
import { CustomError } from '../custom_error.js';

test('CustomError', async (t) => {
  await t.test(
    'should return object err with expected properties',
    async () => {
      const customError = new CustomError(
        'Custom message.',
        Code.Accepted,
      );

      assert.strictEqual(customError.name, Code.Accepted);
      assert.strictEqual(
        customError.message,
        'Custom message.',
      );
      assert.strictEqual(customError.code, Code.Accepted);
      assert(customError instanceof Error);
      assert(customError instanceof CustomError);

      assert.strictEqual(
        customError.toString(),
        'Accepted: Custom message.',
      );
    },
  );
});
