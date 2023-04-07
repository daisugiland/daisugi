import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Ayamari } from '../ayamari.js';

test('Ayamari', async (t) => {
  await t.test('should work', async () => {
    const { errFn } = new Ayamari();
    const err = errFn.Fail('err');
    assert.equal(err.code, 575);
    assert.equal(err.name, 'Fail [575]');
    assert.equal(err.message, 'err');
    assert.equal(err.stack, 'No stack');
    assert.equal(err.levelValue, 30);
    assert.equal(err.cause, null);
    assert.equal(typeof err.createdAt, 'string');
  });

  await t.test(
    'should work with global options',
    async () => {
      const { errFn } = new Ayamari({
        levelValue: 10,
        injectStack: true,
      });
      const nativeErr = new Error('native err');
      const err = errFn.Fail('err', {
        cause: nativeErr,
      });
      assert.equal(err.code, 575);
      assert.equal(err.name, 'Fail [575]');
      assert.equal(err.message, 'err');
      assert.equal(
        err.stack.split('\n')[0],
        'Fail [575]: err',
      );
      assert.equal(err.levelValue, 10);
      assert.equal(err.cause, nativeErr);
    },
  );

  await t.test('should work with options', async () => {
    const { errFn } = new Ayamari({
      levelValue: 10,
    });
    const err = errFn.Fail('err', {
      injectStack: true,
      levelValue: 20,
    });
    assert.equal(err.code, 575);
    assert.equal(err.name, 'Fail [575]');
    assert.equal(err.message, 'err');
    assert.equal(
      err.stack.split('\n')[0],
      'Fail [575]: err',
    );
    assert.equal(err.levelValue, 20);
    assert.equal(err.cause, null);
  });

  await t.test('should could customize errFn', async () => {
    const customNameToErrCode = {
      FooErr: 1,
    };
    const { errFn } = new Ayamari({
      customErrCode: customNameToErrCode,
    });
    assert.equal(errFn.FooErr('err').code, 1);
  });

  await t.test('should print pretty stack', async () => {
    const { errFn } = new Ayamari({
      injectStack: true,
      color: false,
    });
    const nativeErr = new Error('native err');
    const err = errFn.Fail('err', {
      cause: nativeErr,
    });
    assert.match(err.prettyStack(), /Fail \[575\]: err/);
  });
});
