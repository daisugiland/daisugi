import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Code } from '../code.js';
import { CustomError } from '../custom_error.js';

describe('CustomError', () => {
  it('should return object err with expected properties', () => {
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
  });
});
