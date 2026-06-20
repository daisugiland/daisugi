import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { hashFNV1A } from '../hash_fnv1a.js';

describe('hashFNV1A', () => {
  it('should be deterministic for the same string', () => {
    assert.strictEqual(
      hashFNV1A('hello'),
      hashFNV1A('hello'),
    );
  });

  it('should match the known hash for a string', () => {
    assert.strictEqual(hashFNV1A('hello'), 1335831723);
  });

  it('should produce an unsigned 32-bit integer', () => {
    const hash = hashFNV1A('hello');
    assert.ok(hash >= 0);
    assert.ok(hash <= 0xffffffff);
    // oxlint-disable-next-line unicorn/prefer-math-trunc
    assert.strictEqual(hash, hash >>> 0);
  });

  it('should produce different hashes for different strings', () => {
    assert.notStrictEqual(hashFNV1A('a'), hashFNV1A('b'));
  });

  it('should hash a string as its UTF-8 bytes', () => {
    const textEncoder = new TextEncoder();
    for (const value of ['hello', 'é', '\u{10437}', '😀']) {
      assert.strictEqual(
        hashFNV1A(value),
        hashFNV1A(textEncoder.encode(value)),
      );
    }
  });

  it('should hash a Uint8Array input', () => {
    assert.strictEqual(
      hashFNV1A(new Uint8Array([1, 2, 3])),
      1456420779,
    );
  });

  it('should throw for unsupported input', () => {
    // @ts-expect-error testing invalid input
    assert.throws(() => hashFNV1A(123));
  });
});
