import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  Ayamari,
  findCauseByCode,
  isAyamariErr,
  level,
  prettifyStack,
} from '../ayamari.js';

describe('Ayamari', () => {
  it('should work', () => {
    const { errFn } = new Ayamari();
    const err = errFn.Fail('err');
    assert.equal(err.code, 'Fail');
    assert.equal(err.name, 'Fail');
    assert.equal(err.message, 'err');
    assert.equal(err.stack, 'Fail: err');
    assert.equal(err.cause, null);
  });

  it('should be an instance of Error', () => {
    const { errFn } = new Ayamari();
    const err = errFn.Fail('err');
    assert.ok(err instanceof Error);
  });

  it('should work with global options', () => {
    const { errFn } = new Ayamari({
      injectStack: true,
    });
    const nativeErr = new Error('native err');
    const err = errFn.Fail('err', {
      cause: nativeErr,
    });
    assert.equal(err.code, 'Fail');
    assert.equal(err.name, 'Fail');
    assert.equal(err.message, 'err');
    assert.equal(err.stack.split('\n')[0], 'Fail: err');
    assert.equal(err.cause, nativeErr);
  });

  it('should work with options', () => {
    const { errFn } = new Ayamari();
    const err = errFn.Fail('err', {
      injectStack: true,
    });
    assert.equal(err.code, 'Fail');
    assert.equal(err.name, 'Fail');
    assert.equal(err.message, 'err');
    assert.equal(err.stack.split('\n')[0], 'Fail: err');
    assert.equal(err.cause, null);
  });

  it('should could customize errFn', () => {
    const customErrCode = {
      FooErr: 'FooErr',
    };
    const { errFn } = new Ayamari({
      customErrCode,
    });
    assert.equal(errFn.FooErr('err').code, 'FooErr');
  });

  describe('levelValue', () => {
    it('should default to error for every code', () => {
      const { errFn } = new Ayamari();
      assert.equal(
        errFn.UnexpectedError('boom').levelValue,
        level.error,
      );
      assert.equal(
        errFn.NotFound('missing').levelValue,
        level.error,
      );
      assert.equal(
        errFn.StopPropagation('halt').levelValue,
        level.error,
      );
    });

    it('should let opts.levelValue override the default', () => {
      const { errFn } = new Ayamari();
      const err = errFn.NotFound('missing', {
        levelValue: level.debug,
      });
      assert.equal(err.levelValue, level.debug);
    });
  });

  describe('isAyamariErr', () => {
    it('should be true for an Ayamari error', () => {
      const { errFn } = new Ayamari();
      assert.equal(isAyamariErr(errFn.Fail('boom')), true);
    });

    it('should be false for native errors and non-errors', () => {
      assert.equal(isAyamariErr(new Error('boom')), false);
      // A native error carrying its own `code`/`meta` must not be
      // mistaken for an Ayamari error (the brand, not duck-typing).
      assert.equal(
        isAyamariErr({ code: 'ENOENT', meta: {} }),
        false,
      );
      assert.equal(isAyamariErr(null), false);
    });
  });

  describe('propagateErr', () => {
    it('should reuse the code of an AyamariErr cause', () => {
      const { errFn, propagateErr } = new Ayamari();
      const cause = errFn.NotFound('missing');
      const err = propagateErr('wrapped', { cause });
      assert.equal(err.code, 'NotFound');
      assert.equal(err.name, 'NotFound');
      assert.equal(err.message, 'wrapped');
      assert.equal(err.cause, cause);
    });

    it('should fall back to UnexpectedError for a native Error cause', () => {
      const { propagateErr } = new Ayamari();
      const cause = new Error('native');
      const err = propagateErr('wrapped', { cause });
      assert.equal(err.code, 'UnexpectedError');
      assert.equal(err.name, 'UnexpectedError');
      assert.equal(err.cause, cause);
    });

    it('propagateErrRes should wrap the error in a failure Result', () => {
      const { errFn, propagateErrRes } = new Ayamari();
      const cause = errFn.NotFound('missing');
      const res = propagateErrRes('wrapped', { cause });
      assert.equal(res.isSuccess, false);
      assert.equal(res.unwrapErr().code, 'NotFound');
    });

    it("should carry the cause's levelValue", () => {
      const { errFn, propagateErr } = new Ayamari();
      const cause = errFn.NotFound('missing', {
        levelValue: level.fatal,
      });
      const err = propagateErr('wrapped', { cause });
      assert.equal(err.levelValue, level.fatal);
    });
  });

  describe('findCauseByCode', () => {
    it('should find a matching error deep in the cause chain', () => {
      const { errFn } = new Ayamari();
      const root = errFn.NotFound('missing');
      const middle = errFn.Fail('mid', { cause: root });
      const top = errFn.Timeout('top', { cause: middle });
      assert.equal(findCauseByCode(top, 'NotFound'), root);
    });

    it('should match the error itself', () => {
      const { errFn } = new Ayamari();
      const err = errFn.NotFound('missing');
      assert.equal(findCauseByCode(err, 'NotFound'), err);
    });

    it('should match a native error in the chain by its code', () => {
      const { errFn } = new Ayamari();
      const native = Object.assign(new Error('fs'), {
        code: 'ENOENT',
      });
      const err = errFn.Fail('wrapped', { cause: native });
      assert.equal(findCauseByCode(err, 'ENOENT'), native);
    });

    it('should return null when no cause matches', () => {
      const { errFn } = new Ayamari();
      const err = errFn.Fail('boom');
      assert.equal(findCauseByCode(err, 'NotFound'), null);
      assert.equal(findCauseByCode(null, 'NotFound'), null);
    });

    it('should not hang on a cyclic cause chain', () => {
      const { errFn } = new Ayamari();
      const a = errFn.Fail('a');
      const b = errFn.Fail('b', { cause: a });
      a.cause = b;
      assert.equal(findCauseByCode(b, 'NotFound'), null);
    });
  });

  it('should print pretty stack', () => {
    const { errFn } = new Ayamari({
      injectStack: true,
    });
    const nativeErr = new Error('native err');
    const err = errFn.Fail('err', {
      cause: nativeErr,
    });
    assert.match(
      prettifyStack(err, { color: false }),
      /Fail: err/u,
    );
  });

  describe('when injectStack is false', () => {
    it('should print pretty stack', () => {
      const { errFn } = new Ayamari();
      const nativeErr = new Error('native err: example');
      const err = errFn.Fail('err', {
        cause: nativeErr,
      });
      assert.match(
        prettifyStack(err, { color: false }),
        /Fail: err/u,
      );
    });

    describe('when cause is null', () => {
      it('should print pretty stack', () => {
        const { errFn } = new Ayamari();
        const err = errFn.Fail('err');
        assert.match(
          prettifyStack(err, { color: false }),
          /Fail: err/u,
        );
      });
    });
  });
});
