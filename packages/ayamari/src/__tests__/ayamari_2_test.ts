import assert from 'node:assert/strict';
import { test } from 'node:test';

import { err } from '../ayamari_2.js';

function err1(param: string) {
  try {
    return new URL(param);
  } catch (err) {
    return err.NotFound('Not found 1', {
      cause: err as Error,
      args: arguments,
    });
  }
}

function err2(_: string) {
  return err.NotFound('Not found 2', {
    // @ts-ignore
    cause: err1('bar').getError(),
    args: arguments,
    data: {
      foo: 'bar',
    },
  });
}

test('Ayamari', async (t) => {
  await t.test('should return pretty stack', async () => {
    const errRes = err2('foo');
    assert.equal(
      errRes.getError().prettyStack(true),
      `
  NotFound [404]: Not found 2

  data: {"foo":"bar"}

  - ayamari_test.js 16 err2("foo")
    file://~/dist/esm/__tests__/ayamari_test.js:16:19

  - ayamari_test.js 27 TestContext.<anonymous>
    file://~/dist/esm/__tests__/ayamari_test.js:27:24

  - ayamari_test.js 26 TestContext.<anonymous>
    file://~/dist/esm/__tests__/ayamari_test.js:26:13

  └── NotFound [404]: Not found 1

  - ayamari_test.js 9 err1("bar")
    file://~/dist/esm/__tests__/ayamari_test.js:9:23

  - ayamari_test.js 18 err2
    file://~/dist/esm/__tests__/ayamari_test.js:18:16

  └── TypeError [ERR_INVALID_URL]: Invalid URL

  input: "bar"

  - ayamari_test.js 6 err1
    file://~/dist/esm/__tests__/ayamari_test.js:6:16
`,
    );
  });
});
