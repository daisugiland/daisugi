import assert from 'node:assert/strict';
import { test } from 'node:test';

import { appErr } from '../ayamari.js';

function err1() {
  return appErr.NotFound('Not found 1');
}

function err2() {
  return appErr.NotFound('Not found 2', {
    cause: err1().getError(),
  });
}

test('Ayamari', async (t) => {
  await t.test('should work', async () => {
    const errRes = err2();
    const err = errRes.getError();
    console.log(err.prettyStack());
    assert.equal(err.prettyStack(), '');
  });
});
