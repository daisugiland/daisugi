import assert from 'node:assert/strict';
import { test } from 'node:test';

import { appErr } from '../ayamari.js';

function err1(param: string) {
  try {
    return new URL(param);
  } catch (err) {
    return appErr.NotFound('Not found 1', {
      cause: err as Error,
      args: arguments,
    });
  }
}

function err2(_: string) {
  return appErr.NotFound('Not found 2', {
    // @ts-ignore
    cause: err1('bar').getError(),
    args: arguments,
    metadata: {
      foo: 'bar',
    },
  });
}

test('Ayamari', async (t) => {
  await t.test('should work', async () => {
    const errRes = err2('foo');
    const err = errRes.getError();
    console.log(err.prettyStack());
    console.log(err);
    assert.equal(err.prettyStack(), '');
  });
});
