import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Ayamari } from '../ayamari.js';

describe('Ayamari', () => {
  it('should work', () => {
    const { errFn } = new Ayamari();
    const err = errFn.Fail('err');
    assert.equal(err.code, 575);
    assert.equal(err.name, 'Fail [575]');
    assert.equal(err.message, 'err');
    assert.equal(err.stack, 'Fail [575]: err');
    assert.equal(err.levelValue, 30);
    assert.equal(err.cause, null);
    assert.equal(typeof err.createdAt, 'string');
  });

  it('should work with global options', () => {
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
  });

  it('should work with options', () => {
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

  it('should could customize errFn', () => {
    const customErrCode = {
      FooErr: 1,
    };
    const { errFn } = new Ayamari({
      customErrCode,
    });
    assert.equal(errFn.FooErr('err').code, 1);
  });

  it('should print pretty stack', () => {
    const { errFn } = new Ayamari({
      injectStack: true,
    });
    const nativeErr = new Error('native err');
    const err = errFn.Fail('err', {
      cause: nativeErr,
    });
    assert.match(Ayamari.prettifyStack(err, false), /Fail \[575\]: err/);
  });

  describe('when injectStack is false', () => {
    it('should print pretty stack', () => {
      const { errFn } = new Ayamari();
      const nativeErr = new Error('native err: example');
      const err = errFn.Fail('err', {
        cause: nativeErr,
      });
      assert.match(Ayamari.prettifyStack(err, false), /Fail \[575\]: err/);
    });

    describe('when cause is null', () => {
      it('should print pretty stack', () => {
        const { errFn } = new Ayamari();
        const err = errFn.Fail('err');
        assert.match(Ayamari.prettifyStack(err, false), /Fail \[575\]: err/);
      });
    });
  });
});
