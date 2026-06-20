import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Result } from '@daisugi/anzen';

import { waitFor } from '../wait_for.js';
import { withMemo } from '../with_memo.js';

describe('withMemo', () => {
  it('should cache the result across calls', async () => {
    let count = 0;
    const memoized = withMemo(async (a: number) => {
      count += 1;
      return Result.success(a);
    });

    const first = await memoized(1);
    const second = await memoized(1);

    assert.strictEqual(count, 1);
    assert.strictEqual(first.getValue(), 1);
    assert.strictEqual(second.getValue(), 1);
  });

  it('should share one execution across concurrent calls', async () => {
    let count = 0;
    const memoized = withMemo(async (a: number) => {
      count += 1;
      await waitFor(5);
      return Result.success(a);
    });

    await Promise.all([memoized(2), memoized(2)]);

    assert.strictEqual(count, 1);
  });

  it('should compute separately per distinct arguments', async () => {
    let count = 0;
    const memoized = withMemo(async (a: number) => {
      count += 1;
      return Result.success(a);
    });

    await memoized(1);
    await memoized(2);

    assert.strictEqual(count, 2);
  });
});
