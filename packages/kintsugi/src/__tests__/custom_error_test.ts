import assert from 'node:assert';
import test from 'node:test';

import { CustomError } from '../custom_error.js';
import { Code } from '../code.js';

test('CustomError', async (t) => {
  await t.test(
    'should return object error with expected properties',
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
