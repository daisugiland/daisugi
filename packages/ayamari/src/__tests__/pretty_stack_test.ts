import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Ayamari, type AyamariErr } from '../ayamari.js';
import { PrettyStack } from '../pretty_stack.js';

const { errFn } = new Ayamari();

describe('PrettyStack.print', () => {
  describe('given an AyamariErr without stack frames', () => {
    it('returns only the header line', () => {
      const error = errFn.UnexpectedError(
        'something went wrong',
      );

      const result = PrettyStack.print(error);

      assert.equal(
        result,
        'UnexpectedError: something went wrong',
      );
    });
  });

  describe('given an error without cause', () => {
    it('includes user frames', () => {
      const error = errFn.UnexpectedError('top level');
      error.stack = [
        'UnexpectedError: top level',
        '    at userFn (/project/src/foo.ts:10:5)',
      ].join('\n');

      const result = PrettyStack.print(error);

      assert.match(result, /userFn/u);
    });

    it('omits native node: frames', () => {
      const error = errFn.UnexpectedError('top level');
      error.stack = [
        'UnexpectedError: top level',
        '    at userFn (/project/src/foo.ts:10:5)',
        '    at node:internal/process/task_queues:140:7',
      ].join('\n');

      const result = PrettyStack.print(error);

      assert.doesNotMatch(result, /node:internal/u);
    });
  });

  describe('given frames to reformat', () => {
    it('labels anonymous frames as <unknown>', () => {
      const error = errFn.UnexpectedError('top level');
      error.stack = [
        'UnexpectedError: top level',
        '    at /project/src/anon.ts:3:1',
      ].join('\n');

      const result = PrettyStack.print(error);

      assert.match(
        result,
        /at <unknown> \(\/project\/src\/anon\.ts:3:1\)/u,
      );
    });

    it('renders frames that have no column', () => {
      const error = errFn.UnexpectedError('top level');
      error.stack = [
        'UnexpectedError: top level',
        '    at noCol (/project/src/x.ts:7)',
      ].join('\n');

      const result = PrettyStack.print(error);

      assert.match(
        result,
        /at noCol \(\/project\/src\/x\.ts:7\)/u,
      );
      assert.doesNotMatch(result, /x\.ts:7:/u);
    });

    it('displays builtin frames with an <anonymous> location', () => {
      const error = errFn.UnexpectedError('boom');
      error.stack = [
        'UnexpectedError: boom',
        '    at callback (/project/src/foo.ts:10:5)',
        '    at Array.map (<anonymous>)',
      ].join('\n');

      const result = PrettyStack.print(error);

      assert.match(result, /callback/u);
      assert.match(
        result,
        /at Array\.map \(<anonymous>\)/u,
      );
    });

    it('displays the <anonymous> builtin frames a real V8 stack emits', () => {
      let error: AyamariErr | undefined;
      try {
        [1].map(() => {
          throw errFn.UnexpectedError('inside map', {
            injectStack: true,
          });
        });
      } catch (caught) {
        error = caught as AyamariErr;
      }
      assert.ok(error);

      const result = PrettyStack.print(error);

      assert.match(result, /<anonymous>/u);
    });
  });

  describe('given a custom frameFilter', () => {
    it('drops frames the filter rejects', () => {
      const error = errFn.UnexpectedError('boom');
      error.stack = [
        'UnexpectedError: boom',
        '    at keep (/project/src/keep.ts:1:1)',
        '    at drop (/project/src/drop.ts:2:2)',
      ].join('\n');

      const result = PrettyStack.print(error, {
        color: false,
        frameFilter: (frame) =>
          !frame.file.includes('drop.ts'),
      });

      assert.match(result, /keep/u);
      assert.doesNotMatch(result, /drop/u);
    });

    it('can retain node: frames the default would drop', () => {
      const error = errFn.UnexpectedError('boom');
      error.stack = [
        'UnexpectedError: boom',
        '    at internal (node:internal/foo:1:1)',
      ].join('\n');

      const result = PrettyStack.print(error, {
        color: false,
        frameFilter: () => true,
      });

      assert.match(result, /node:internal\/foo/u);
    });

    it('drops node: frames by default', () => {
      const error = errFn.UnexpectedError('boom');
      error.stack = [
        'UnexpectedError: boom',
        '    at internal (node:internal/foo:1:1)',
      ].join('\n');

      const result = PrettyStack.print(error);

      assert.doesNotMatch(result, /node:internal/u);
    });
  });

  describe('given an error with one cause', () => {
    it('puts the top-level error before the cause', () => {
      const cause = errFn.NotFound('record missing');
      const error = errFn.UnexpectedError('query failed', {
        cause,
      });

      const result = PrettyStack.print(error);

      assert.ok(
        result.indexOf('query failed') <
          result.indexOf('record missing'),
      );
    });
  });

  describe('given an error with a deep chain', () => {
    it('outputs all errors in top-level-first order', () => {
      const root = errFn.NotFound('not found');
      const middle = errFn.UnexpectedError('query failed', {
        cause: root,
      });
      const top = errFn.Timeout('service down', {
        cause: middle,
      });

      const result = PrettyStack.print(top);

      const topIdx = result.indexOf('service down');
      const middleIdx = result.indexOf('query failed');
      const rootIdx = result.indexOf('not found');
      assert.ok(topIdx < middleIdx);
      assert.ok(middleIdx < rootIdx);
    });

    it('includes unique frames from all levels', () => {
      const root = errFn.NotFound('not found');
      root.stack =
        'NotFound: not found\n    at rootFn (/project/src/root.ts:5:3)';
      const middle = errFn.UnexpectedError('query failed', {
        cause: root,
      });
      middle.stack =
        'UnexpectedError: query failed\n    at middleFn (/project/src/middle.ts:10:5)';
      const top = errFn.Timeout('service down', {
        cause: middle,
      });
      top.stack =
        'Timeout: service down\n    at topFn (/project/src/top.ts:20:8)';

      const result = PrettyStack.print(top);

      assert.match(result, /topFn/u);
      assert.match(result, /middleFn/u);
      assert.match(result, /rootFn/u);
    });

    it('deduplicates a frame shared across 3 levels', () => {
      const sharedFrame =
        '    at sharedFn (/project/src/shared.ts:5:3)';
      const root = errFn.NotFound('root');
      root.stack = `NotFound: root\n${sharedFrame}`;
      const middle = errFn.UnexpectedError('middle', {
        cause: root,
      });
      middle.stack = [
        'UnexpectedError: middle',
        sharedFrame,
        '    at middleFn (/project/src/middle.ts:10:5)',
      ].join('\n');
      const top = errFn.Timeout('top', {
        cause: middle,
      });
      top.stack = [
        'Timeout: top',
        sharedFrame,
        '    at topFn (/project/src/top.ts:20:8)',
      ].join('\n');

      const result = PrettyStack.print(top);

      assert.equal(result.split('sharedFn').length - 1, 1);
    });
  });

  describe('given nested errors (cause chain)', () => {
    it('joins each level with a "caused by" connector', () => {
      const cause = errFn.NotFound('record missing');
      const error = errFn.UnexpectedError('query failed', {
        cause,
      });

      const result = PrettyStack.print(error);

      assert.match(result, /└── caused by/u);
      assert.match(
        result,
        /UnexpectedError: query failed/u,
      );
      assert.match(result, /NotFound: record missing/u);
    });

    it('emits one connector per nesting level', () => {
      const root = errFn.NotFound('not found');
      const middle = errFn.UnexpectedError('query failed', {
        cause: root,
      });
      const top = errFn.Timeout('service down', {
        cause: middle,
      });

      const result = PrettyStack.print(top);

      const connectors =
        result.split('└── caused by').length - 1;
      assert.equal(connectors, 2);
    });

    it('renders a single error without any connector', () => {
      const error = errFn.UnexpectedError('lonely');

      const result = PrettyStack.print(error);

      assert.doesNotMatch(result, /caused by/u);
    });

    it('nests a native Error cause under an AyamariErr', () => {
      const cause = new Error('native boom');
      const error = errFn.UnexpectedError('wrapped', {
        cause,
      });

      const result = PrettyStack.print(error);

      assert.match(result, /UnexpectedError: wrapped/u);
      assert.match(result, /└── caused by/u);
      assert.match(result, /Error: native boom/u);
    });
  });

  describe('given frames duplicated across the chain', () => {
    it('includes each duplicate frame only once', () => {
      const sharedFrame =
        '    at sharedFn (/project/src/shared.ts:5:3)';
      const root = errFn.NotFound('root error');
      root.stack = `NotFound: root error\n${sharedFrame}`;
      const top = errFn.UnexpectedError('top error', {
        cause: root,
      });
      top.stack = [
        'UnexpectedError: top error',
        sharedFrame,
        '    at otherFn (/project/src/other.ts:10:5)',
      ].join('\n');

      const result = PrettyStack.print(top);

      const occurrences =
        result.split('sharedFn').length - 1;
      assert.equal(occurrences, 1);
    });
  });

  describe('given frames with absolute paths', () => {
    it('replaces process.cwd() with ~', () => {
      const cwd = process.cwd();
      const error = errFn.UnexpectedError('path test');
      error.stack = `UnexpectedError: path test\n    at myFn (${cwd}/src/foo.ts:10:5)`;

      const result = PrettyStack.print(error);

      assert.ok(!result.includes(cwd));
      assert.match(result, /~/u);
    });

    it('replaces all occurrences of cwd in a single frame', () => {
      const cwd = process.cwd();
      const error = errFn.UnexpectedError('path test');
      error.stack = `UnexpectedError: path test\n    at myFn (${cwd}/src/foo.ts:10:5) ${cwd}/other.ts`;

      const result = PrettyStack.print(error);

      assert.ok(!result.includes(cwd));
    });
  });

  describe('given a native Error as cause', () => {
    it('includes its message and user frames in the chain', () => {
      const nativeErr = new Error('native failure');
      nativeErr.stack = [
        'Error: native failure',
        '    at nativeFn (/project/src/native.ts:20:3)',
      ].join('\n');
      const error = errFn.UnexpectedError(
        'wrapping native',
        {
          cause: nativeErr,
        },
      );

      const result = PrettyStack.print(error);

      assert.match(result, /native failure/u);
      assert.match(result, /nativeFn/u);
      assert.ok(
        result.indexOf('wrapping native') <
          result.indexOf('native failure'),
      );
    });
  });

  describe('given a native Error as the top-level argument', () => {
    it('formats its header and user frames', () => {
      const error = new Error('plain failure');
      error.stack = [
        'Error: plain failure',
        '    at plainFn (/project/src/plain.ts:7:1)',
      ].join('\n');

      const result = PrettyStack.print(error);

      assert.match(result, /Error: plain failure/u);
      assert.match(result, /plainFn/u);
    });

    it('prints its extra properties', () => {
      const error = new Error('plain failure') as Error & {
        code: string;
      };
      error.code = 'EPLAIN';

      const result = PrettyStack.print(error);

      assert.match(result, /code: EPLAIN/u);
    });
  });

  describe('given an error with extra properties', () => {
    it('prints non-standard properties after the header', () => {
      const error = new Error('Invalid URL') as Error & {
        code: string;
        input: string;
      };
      error.code = 'ERR_INVALID_URL';
      error.input = 'not-a-url';
      const wrapped = errFn.UnexpectedError(
        'request failed',
        {
          cause: error,
        },
      );

      const result = PrettyStack.print(wrapped);

      assert.match(result, /code: ERR_INVALID_URL/u);
      assert.match(result, /input: not-a-url/u);
    });

    it('does not print standard Error properties as extras', () => {
      const error = new Error('oops');
      const wrapped = errFn.UnexpectedError('failed', {
        cause: error,
      });

      const result = PrettyStack.print(wrapped);

      assert.doesNotMatch(result, /\bname:/u);
      assert.doesNotMatch(result, /\bstack:/u);
      assert.doesNotMatch(result, /\bmessage:/u);
      assert.doesNotMatch(result, /\bcause:/u);
    });

    it('skips properties with null or undefined values', () => {
      const error = new Error('oops') as Error & {
        nullProp: null;
      };
      error.nullProp = null;
      const wrapped = errFn.UnexpectedError('failed', {
        cause: error,
      });

      const result = PrettyStack.print(wrapped);

      assert.doesNotMatch(result, /nullProp/u);
    });

    it('JSON-stringifies object values', () => {
      const error = new Error('oops') as Error & {
        context: object;
      };
      error.context = {
        url: 'https://example.com',
        status: 503,
      };
      const wrapped = errFn.UnexpectedError('failed', {
        cause: error,
      });

      const result = PrettyStack.print(wrapped);

      assert.match(result, /context: \{.*url.*503.*\}/u);
    });

    it('prints extra props from AyamariErr meta field', () => {
      const error = errFn.NotFound('user not found', {
        meta: { userId: 42 },
      });

      const result = PrettyStack.print(error);

      assert.match(result, /meta: \{.*userId.*42.*\}/u);
    });

    it('renders [Circular] instead of throwing when an extra prop has a cycle', () => {
      const circular: Record<string, unknown> = {
        name: 'req',
      };
      circular['self'] = circular;
      const cause = new Error('axios failed') as Error & {
        circularProp: unknown;
      };
      cause.circularProp = circular;
      const wrapped = errFn.UnexpectedError('failed', {
        cause,
      });

      const result = PrettyStack.print(wrapped);

      assert.match(result, /circularProp:/u);
      assert.match(result, /\[Circular\]/u);
      assert.match(result, /axios failed/u);
    });

    it('survives nested circular structures under a non-filtered key', () => {
      const a: Record<string, unknown> = { kind: 'A' };
      const b: Record<string, unknown> = { kind: 'B' };
      a['b'] = b;
      b['a'] = a;
      const cause = new Error('axios 401') as Error & {
        details: unknown;
      };
      cause.details = a;
      const wrapped = errFn.UnexpectedError(
        'sso check failed',
        {
          cause,
        },
      );

      const result = PrettyStack.print(wrapped);

      assert.match(result, /details:/u);
      assert.match(result, /\[Circular\]/u);
    });
  });

  describe('given an error with sensitive axios properties', () => {
    it('omits the config property to avoid leaking auth_token / cookies', () => {
      const cause = new Error(
        'Request failed with status code 401',
      ) as Error & {
        config: object;
      };
      cause.config = {
        url: '/api/auth/check',
        method: 'GET',
        headers: { Cookie: 'auth_token=secret-jwt' },
        data: { password: 'shh' },
      };
      const wrapped = errFn.UnexpectedError(
        'sso check failed',
        {
          cause,
        },
      );

      const result = PrettyStack.print(wrapped, {
        color: false,
        sensitiveKeys: ['config', 'request', 'response'],
      });

      assert.doesNotMatch(result, /config:/u);
      assert.doesNotMatch(result, /auth_token/u);
      assert.doesNotMatch(result, /secret-jwt/u);
      assert.doesNotMatch(result, /password/u);
      assert.match(
        result,
        /Request failed with status code 401/u,
      );
    });

    it('omits the request and response properties', () => {
      const cause = new Error('axios error') as Error & {
        request: object;
        response: object;
      };
      cause.request = {
        path: '/api/auth/check',
        method: 'GET',
      };
      cause.response = {
        status: 401,
        headers: { 'set-cookie': 'auth_token=leak' },
        data: 'Unauthorized',
      };
      const wrapped = errFn.UnexpectedError(
        'sso check failed',
        {
          cause,
        },
      );

      const result = PrettyStack.print(wrapped, {
        color: false,
        sensitiveKeys: ['config', 'request', 'response'],
      });

      assert.doesNotMatch(result, /\brequest:/u);
      assert.doesNotMatch(result, /\bresponse:/u);
      assert.doesNotMatch(result, /set-cookie/u);
      assert.doesNotMatch(result, /auth_token=leak/u);
    });

    it('keeps non-sensitive sibling properties (code, status)', () => {
      const cause = new Error('boom') as Error & {
        config: object;
        code: string;
        status: number;
      };
      cause.config = {
        headers: { Cookie: 'auth_token=secret' },
      };
      cause.code = 'ERR_BAD_REQUEST';
      cause.status = 401;
      const wrapped = errFn.UnexpectedError('failed', {
        cause,
      });

      const result = PrettyStack.print(wrapped, {
        color: false,
        sensitiveKeys: ['config', 'request', 'response'],
      });

      assert.doesNotMatch(result, /config:/u);
      assert.doesNotMatch(result, /auth_token/u);
      assert.match(result, /code: ERR_BAD_REQUEST/u);
      assert.match(result, /status: 401/u);
    });
  });

  describe('given node_modules frames', () => {
    it('collapses consecutive frames from the same package into a summary', () => {
      const error = errFn.UnexpectedError('render error');
      error.stack = [
        'UnexpectedError: render error',
        '    at userFn (/project/src/foo.ts:10:5)',
        '    at renderWithHooks (/project/node_modules/.pnpm/react-dom@19.2.3_react@19.2.3/node_modules/react-dom/cjs/react-dom-server.js:5062:19)',
        '    at renderElement (/project/node_modules/.pnpm/react-dom@19.2.3_react@19.2.3/node_modules/react-dom/cjs/react-dom-server.js:5497:23)',
        '    at renderRoot (/project/node_modules/.pnpm/react-dom@19.2.3_react@19.2.3/node_modules/react-dom/cjs/react-dom-server.js:6000:5)',
      ].join('\n');

      const result = PrettyStack.print(error);

      assert.match(
        result,
        /\.\.\. 3 frames in \[react-dom@19\.2\.3\]/u,
      );
      assert.doesNotMatch(result, /renderWithHooks/u);
      assert.doesNotMatch(result, /renderElement/u);
    });

    it('produces a separate summary for each different package', () => {
      const error = errFn.UnexpectedError('error');
      error.stack = [
        'UnexpectedError: error',
        '    at fn1 (/project/node_modules/.pnpm/fastify@5.0.0/node_modules/fastify/lib/server.js:10:5)',
        '    at fn2 (/project/node_modules/.pnpm/react-dom@19.2.3_react@19.2.3/node_modules/react-dom/cjs/react-dom.js:20:3)',
      ].join('\n');

      const result = PrettyStack.print(error);

      assert.match(result, /\[fastify@5\.0\.0\]/u);
      assert.match(result, /\[react-dom@19\.2\.3\]/u);
    });

    it('keeps user frames between node_modules summaries', () => {
      const error = errFn.UnexpectedError('error');
      error.stack = [
        'UnexpectedError: error',
        '    at userFn (/project/src/handler.ts:10:5)',
        '    at renderWithHooks (/project/node_modules/.pnpm/react-dom@19.2.3_react@19.2.3/node_modules/react-dom/cjs/react-dom-server.js:5062:19)',
        '    at anotherUserFn (/project/src/component.ts:20:3)',
      ].join('\n');

      const result = PrettyStack.print(error);

      assert.match(result, /userFn/u);
      assert.match(result, /anotherUserFn/u);
      assert.match(result, /\[react-dom@19\.2\.3\]/u);
      assert.ok(
        result.indexOf('userFn') <
          result.indexOf('react-dom'),
      );
      assert.ok(
        result.indexOf('react-dom') <
          result.indexOf('anotherUserFn'),
      );
    });

    it('collapses node_modules frames at the end of the stack', () => {
      const error = errFn.UnexpectedError('error');
      error.stack = [
        'UnexpectedError: error',
        '    at userFn (/project/src/handler.ts:10:5)',
        '    at renderWithHooks (/project/node_modules/.pnpm/react-dom@19.2.3_react@19.2.3/node_modules/react-dom/cjs/react-dom-server.js:5062:19)',
        '    at renderElement (/project/node_modules/.pnpm/react-dom@19.2.3_react@19.2.3/node_modules/react-dom/cjs/react-dom-server.js:5497:23)',
      ].join('\n');

      const result = PrettyStack.print(error);

      assert.match(
        result,
        /\.\.\. 2 frames in \[react-dom@19\.2\.3\]/u,
      );
    });

    it('handles npm (non-pnpm) node_modules paths', () => {
      const error = errFn.UnexpectedError('error');
      error.stack = [
        'UnexpectedError: error',
        '    at fn1 (/project/node_modules/fastify/lib/server.js:10:5)',
      ].join('\n');

      const result = PrettyStack.print(error);

      assert.match(result, /\[fastify\]/u);
    });

    it('handles scoped packages in pnpm paths', () => {
      const error = errFn.UnexpectedError('error');
      error.stack = [
        'UnexpectedError: error',
        '    at fn1 (/project/node_modules/.pnpm/@fastify+static@8.0.0/node_modules/@fastify/static/index.js:10:5)',
      ].join('\n');

      const result = PrettyStack.print(error);

      assert.match(result, /\[@fastify\/static@8\.0\.0\]/u);
    });
  });
});
