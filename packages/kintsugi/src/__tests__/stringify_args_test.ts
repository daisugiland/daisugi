import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { stringifyArgs } from '../stringify_args.js';

describe('stringifyArgs', () => {
  it('should be insensitive to object key order', () => {
    assert.strictEqual(
      stringifyArgs([{ a: 1, b: 2 }]),
      stringifyArgs([{ b: 2, a: 1 }]),
    );
  });

  it('should sort nested object keys too', () => {
    assert.strictEqual(
      stringifyArgs([{ outer: { y: 1, x: 2 } }]),
      stringifyArgs([{ outer: { x: 2, y: 1 } }]),
    );
  });

  it('should keep a number distinct from its string form', () => {
    assert.notStrictEqual(
      stringifyArgs([1]),
      stringifyArgs(['1']),
    );
  });

  it('should serialize a Date via toJSON', () => {
    const date = new Date('2026-06-20T00:00:00.000Z');
    assert.strictEqual(
      stringifyArgs([date]),
      '"2026-06-20T00:00:00.000Z"',
    );
  });
});
