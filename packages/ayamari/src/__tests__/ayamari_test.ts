import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { err as errRes } from '@daisugi/anzen';

import {
  Ayamari,
  findCauseByCode,
  isAyamariErr,
  level,
  formatStack,
} from '../ayamari.js';

describe('Ayamari', () => {
  it('should work', () => {
    const { errs } = new Ayamari();
    const err = errs.Fail('err');
    assert.equal(err.code, 'Fail');
    assert.equal(err.name, 'Fail');
    assert.equal(err.message, 'err');
    assert.equal(err.stack, 'Fail: err');
    assert.equal(err.cause, null);
  });

  it('should be an instance of Error', () => {
    const { errs } = new Ayamari();
    const err = errs.Fail('err');
    assert.ok(err instanceof Error);
  });

  it('should work with global options', () => {
    const { errs } = new Ayamari({
      injectStack: true,
    });
    const nativeErr = new Error('native err');
    const err = errs.Fail('err', {
      cause: nativeErr,
    });
    assert.equal(err.code, 'Fail');
    assert.equal(err.name, 'Fail');
    assert.equal(err.message, 'err');
    assert.equal(err.stack.split('\n')[0], 'Fail: err');
    assert.equal(err.cause, nativeErr);
  });

  it('should work with options', () => {
    const { errs } = new Ayamari();
    const err = errs.Fail('err', {
      injectStack: true,
    });
    assert.equal(err.code, 'Fail');
    assert.equal(err.name, 'Fail');
    assert.equal(err.message, 'err');
    assert.equal(err.stack.split('\n')[0], 'Fail: err');
    assert.equal(err.cause, null);
  });

  it('should could customize errs', () => {
    const customErrCode = {
      FooErr: 'FooErr',
    };
    const { errs } = new Ayamari({
      customErrCode,
    });
    assert.equal(errs.FooErr('err').code, 'FooErr');
  });

  describe('levelValue', () => {
    it('should default to error for every code', () => {
      const { errs } = new Ayamari();
      assert.equal(
        errs.UnexpectedError('boom').levelValue,
        level.error,
      );
      assert.equal(
        errs.NotFound('missing').levelValue,
        level.error,
      );
      assert.equal(
        errs.StopPropagation('halt').levelValue,
        level.error,
      );
    });

    it('should let opts.levelValue override the default', () => {
      const { errs } = new Ayamari();
      const err = errs.NotFound('missing', {
        levelValue: level.debug,
      });
      assert.equal(err.levelValue, level.debug);
    });
  });

  describe('isAyamariErr', () => {
    it('should be true for an Ayamari error', () => {
      const { errs } = new Ayamari();
      assert.equal(isAyamariErr(errs.Fail('boom')), true);
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

  describe('wrapErr', () => {
    it('should reuse the code of an AyamariErr cause', () => {
      const { errs, wrapErr } = new Ayamari();
      const cause = errs.NotFound('missing');
      const err = wrapErr('wrapped', { cause });
      assert.equal(err.code, 'NotFound');
      assert.equal(err.name, 'NotFound');
      assert.equal(err.message, 'wrapped');
      assert.equal(err.cause, cause);
    });

    it('should fall back to UnexpectedError for a native Error cause', () => {
      const { wrapErr } = new Ayamari();
      const cause = new Error('native');
      const err = wrapErr('wrapped', { cause });
      assert.equal(err.code, 'UnexpectedError');
      assert.equal(err.name, 'UnexpectedError');
      assert.equal(err.cause, cause);
    });

    it('wrapErrResult should wrap the error in a failure Result', () => {
      const { errs, wrapErrResult } = new Ayamari();
      const cause = errs.NotFound('missing');
      const res = wrapErrResult('wrapped', { cause });
      assert.equal(res.isOk, false);
      assert.equal(res.unwrapErr().code, 'NotFound');
    });

    it("should carry the cause's levelValue", () => {
      const { errs, wrapErr } = new Ayamari();
      const cause = errs.NotFound('missing', {
        levelValue: level.fatal,
      });
      const err = wrapErr('wrapped', { cause });
      assert.equal(err.levelValue, level.fatal);
    });

    it('should unwrap a ResultErr and use the inner error as cause', () => {
      const { errs, wrapErr } = new Ayamari();
      const inner = errs.NotFound('missing');
      const result = errRes(inner);
      const err = wrapErr('wrapped', { cause: result });
      assert.equal(err.code, 'NotFound');
      assert.equal(err.name, 'NotFound');
      assert.equal(err.message, 'wrapped');
      assert.equal(err.cause, inner);
    });

    it('should carry the levelValue when cause is a ResultErr', () => {
      const { errs, wrapErr } = new Ayamari();
      const inner = errs.NotFound('missing', {
        levelValue: level.fatal,
      });
      const err = wrapErr('wrapped', {
        cause: errRes(inner),
      });
      assert.equal(err.levelValue, level.fatal);
    });

    it('wrapErrResult should unwrap a ResultErr cause', () => {
      const { errs, wrapErrResult } = new Ayamari();
      const inner = errs.NotFound('missing');
      const res = wrapErrResult('wrapped', {
        cause: errRes(inner),
      });
      assert.equal(res.isOk, false);
      const err = res.unwrapErr();
      assert.equal(err.code, 'NotFound');
      assert.equal(err.cause, inner);
    });
  });

  describe('findCauseByCode', () => {
    it('should find a matching error deep in the cause chain', () => {
      const { errs } = new Ayamari();
      const root = errs.NotFound('missing');
      const middle = errs.Fail('mid', { cause: root });
      const top = errs.Timeout('top', { cause: middle });
      assert.equal(findCauseByCode(top, 'NotFound'), root);
    });

    it('should match the error itself', () => {
      const { errs } = new Ayamari();
      const err = errs.NotFound('missing');
      assert.equal(findCauseByCode(err, 'NotFound'), err);
    });

    it('should match a native error in the chain by its code', () => {
      const { errs } = new Ayamari();
      const native = Object.assign(new Error('fs'), {
        code: 'ENOENT',
      });
      const err = errs.Fail('wrapped', { cause: native });
      assert.equal(findCauseByCode(err, 'ENOENT'), native);
    });

    it('should return null when no cause matches', () => {
      const { errs } = new Ayamari();
      const err = errs.Fail('boom');
      assert.equal(findCauseByCode(err, 'NotFound'), null);
      assert.equal(findCauseByCode(null, 'NotFound'), null);
    });

    it('should not hang on a cyclic cause chain', () => {
      const { errs } = new Ayamari();
      const a = errs.Fail('a');
      const b = errs.Fail('b', { cause: a });
      a.cause = b;
      assert.equal(findCauseByCode(b, 'NotFound'), null);
    });
  });

  it('should print pretty stack', () => {
    const { errs } = new Ayamari({
      injectStack: true,
    });
    const nativeErr = new Error('native err');
    const err = errs.Fail('err', {
      cause: nativeErr,
    });
    assert.match(
      formatStack(err, { color: false }),
      /Fail: err/u,
    );
  });

  describe('when injectStack is false', () => {
    it('should print pretty stack', () => {
      const { errs } = new Ayamari();
      const nativeErr = new Error('native err: example');
      const err = errs.Fail('err', {
        cause: nativeErr,
      });
      assert.match(
        formatStack(err, { color: false }),
        /Fail: err/u,
      );
    });

    describe('when cause is null', () => {
      it('should print pretty stack', () => {
        const { errs } = new Ayamari();
        const err = errs.Fail('err');
        assert.match(
          formatStack(err, { color: false }),
          /Fail: err/u,
        );
      });
    });
  });
});
