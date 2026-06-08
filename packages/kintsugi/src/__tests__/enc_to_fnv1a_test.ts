import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { encToFNV1A } from '../enc_to_fnv1a.js';

describe('encToFNV1A', () => {
  it('should be deterministic for the same string', () => {
    assert.strictEqual(
      encToFNV1A('hello'),
      encToFNV1A('hello'),
    );
  });

  it('should match the known hash for a string', () => {
    assert.strictEqual(encToFNV1A('hello'), 1335831723);
  });

  it('should produce an unsigned 32-bit integer', () => {
    const hash = encToFNV1A('hello');
    assert.ok(hash >= 0);
    assert.ok(hash <= 0xffffffff);
    // oxlint-disable-next-line unicorn/prefer-math-trunc
    assert.strictEqual(hash, hash >>> 0);
  });

  it('should produce different hashes for different strings', () => {
    assert.notStrictEqual(encToFNV1A('a'), encToFNV1A('b'));
  });

  it('should hash an astral character', () => {
    assert.strictEqual(encToFNV1A('\u{10437}'), 4223074515);
  });

  it('should hash a Uint8Array input', () => {
    assert.strictEqual(
      encToFNV1A(new Uint8Array([1, 2, 3])),
      1456420779,
    );
  });

  it('should throw for unsupported input', () => {
    // @ts-expect-error testing invalid input
    assert.throws(() => encToFNV1A(123));
  });
});
