import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { urandom } from '../urandom.js';

describe('urandom', () => {
  it('unique', () => {
    assert.notStrictEqual(
      urandom(),
      urandom(),
      '~> single',
    );
    assert.strictEqual(
      urandom().length,
      11,
      'is not 11 characters!',
    );
    const items = new Set();
    for (let i = 1e6; i--; ) items.add(urandom());
    assert.strictEqual(
      items.size,
      1e6,
      '~> 1,000,000 uniques',
    );
  });
});
