import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Ayamari } from '../ayamari.js';

const { createErr } = new Ayamari();

test('Ayamari', async (t) => {
  await t.test('should work', async () => {
    const err = createErr.Fail('err');
    assert.equal(err.code, 575);
    assert.equal(err.name, 'Fail [575]');
    assert.equal(err.message, 'err');
    assert.equal(err.stack, 'No stack');
    assert.equal(err.levelValue, 30);
    assert.equal(err.cause, null);
  });

  await t.test('should work with err options', async () => {
    const nativeErr = new Error('native err');
    const err = createErr.Fail('err', {
      injectStack: true,
      levelValue: 10,
      cause: nativeErr,
    });
    assert.equal(err.code, 575);
    assert.equal(err.name, 'Fail [575]');
    assert.equal(err.message, 'err');
    assert.equal(
      err.stack,
      `Fail [575]: err
    at TestContext.<anonymous> (file:///home/alex/Workspaces/daisugi/packages/ayamari/dist/esm/__tests__/ayamari_test.js:17:31)
    at Test.runInAsyncScope (node:async_hooks:204:9)
    at Test.run (node:internal/test_runner/test:548:25)
    at Test.start (node:internal/test_runner/test:464:17)
    at TestContext.test (node:internal/test_runner/test:136:20)
    at TestContext.<anonymous> (file:///home/alex/Workspaces/daisugi/packages/ayamari/dist/esm/__tests__/ayamari_test.js:15:13)
    at async Test.run (node:internal/test_runner/test:549:9)`,
    );
    assert.equal(err.levelValue, 10);
    assert.equal(err.cause, nativeErr);
  });
});
