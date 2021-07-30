import {
  createWithCache,
  buildCacheKey,
  calculateCacheMaxAgeMs,
  shouldInvalidateCache,
  shouldCache,
} from '../withCache';
import { result } from '../result';
import { SimpleMemoryStore } from '../SimpleMemoryStore';
import { ResultOk } from '../types';

describe('withCache', () => {
  it('should provide expected methods', () => {
    expect(typeof buildCacheKey).toBe('function');
    expect(typeof calculateCacheMaxAgeMs).toBe('function');
    expect(typeof shouldInvalidateCache).toBe('function');
    expect(typeof shouldCache).toBe('function');
  });

  it('should return expected response', async () => {
    const simpleMemoryStore = new SimpleMemoryStore();
    const withCache = createWithCache(simpleMemoryStore);

    let count = 0;

    function fn(): ResultOk<string> {
      count = count + 1;

      return result.ok('ok');
    }

    const fnWithCache = withCache(fn);

    const response1 = await fnWithCache();

    expect(count).toBe(1);
    expect(response1.value).toBe('ok');

    const response2 = await fnWithCache();

    expect(count).toBe(1);
    expect(response2.value).toBe('ok');
  });

  it('should call cache store with proper parameters', async () => {
    const simpleMemoryStore = new SimpleMemoryStore();
    const getMock = jest.spyOn(simpleMemoryStore, 'get');
    const setMock = jest.spyOn(simpleMemoryStore, 'set');
    const withCache = createWithCache(simpleMemoryStore);

    function fn(): ResultOk<string> {
      return result.ok('ok');
    }

    const fnWithCache = withCache(fn);

    await fnWithCache();

    expect(getMock).toBeCalledWith('2046367994:v1:[]');
    expect(setMock).toBeCalledWith(
      '2046367994:v1:[]',
      {
        error: null,
        isFailure: false,
        isSuccess: true,
        value: 'ok',
      },
      expect.any(Number),
    );
    // @ts-ignore
    expect(setMock.mock.calls[0][2]).toBeGreaterThanOrEqual(
      10800000,
    );
    // @ts-ignore
    expect(setMock.mock.calls[0][2]).toBeLessThanOrEqual(
      14400000,
    );
  });

  it('should be customized', async () => {
    const simpleMemoryStore = new SimpleMemoryStore();
    const getMock = jest.spyOn(simpleMemoryStore, 'get');
    const setMock = jest.spyOn(simpleMemoryStore, 'set');
    const withCache = createWithCache(simpleMemoryStore, {
      version: 'v2',
      maxAgeMs: 1000,
      buildCacheKey(fnHash, version, args) {
        return `${fnHash}${version}${JSON.stringify(args)}`;
      },
      calculateCacheMaxAgeMs(maxAgeMs) {
        return maxAgeMs;
      },
    });

    function fn(): ResultOk<string> {
      return result.ok('ok');
    }

    const fnWithCache = withCache(fn);

    await fnWithCache();

    expect(getMock).toBeCalledWith('2046367994v2[]');
    expect(setMock).toBeCalledWith(
      '2046367994v2[]',
      {
        error: null,
        isFailure: false,
        isSuccess: true,
        value: 'ok',
      },
      1000,
    );
  });

  it('should be customized 2', async () => {
    const simpleMemoryStore = new SimpleMemoryStore();
    const getMock = jest.spyOn(simpleMemoryStore, 'get');
    const setMock = jest.spyOn(simpleMemoryStore, 'set');
    const withCache = createWithCache(simpleMemoryStore, {
      version: 'v2',
      maxAgeMs: 1000,
      buildCacheKey(fnHash, version, args) {
        return `${fnHash}${version}${JSON.stringify(
          args,
        )}1`;
      },
      calculateCacheMaxAgeMs(maxAgeMs) {
        return maxAgeMs + 100;
      },
    });

    function fn(): ResultOk<string> {
      return result.ok('ok');
    }

    const fnWithCache = withCache(fn, {
      version: 'v3',
      maxAgeMs: 700,
      buildCacheKey(fnHash, version, args) {
        return `${fnHash}${version}${JSON.stringify(
          args,
        )}2`;
      },
      calculateCacheMaxAgeMs(maxAgeMs) {
        return maxAgeMs + 50;
      },
    });

    await fnWithCache();

    expect(getMock).toBeCalledWith('2046367994v3[]2');
    expect(setMock).toBeCalledWith(
      '2046367994v3[]2',
      {
        error: null,
        isFailure: false,
        isSuccess: true,
        value: 'ok',
      },
      750,
    );
  });

  describe('when `shouldInvalidateCache` returns true', () => {
    it('should invalidate cache', async () => {
      const simpleMemoryStore = new SimpleMemoryStore();
      const withCache = createWithCache(simpleMemoryStore, {
        shouldInvalidateCache(args) {
          return Boolean(args[0]);
        },
        buildCacheKey(_, __, ___) {
          return 'key';
        },
      });

      let count = 0;

      function fn(): ResultOk<string> {
        count = count + 1;

        return result.ok('ok');
      }

      const fnWithCache = withCache(fn);

      const response1 = await fnWithCache(true);

      expect(count).toBe(1);
      expect(response1.value).toBe('ok');

      const response2 = await fnWithCache(true);

      expect(count).toBe(2);
      expect(response2.value).toBe('ok');
    });
  });

  describe('when `shouldCache` is provided', () => {
    it('should return expected response', async () => {
      const simpleMemoryStore = new SimpleMemoryStore();
      const withCache = createWithCache(simpleMemoryStore, {
        shouldCache(response) {
          return response.value !== 'ok';
        },
      });

      let count = 0;

      function fn(): ResultOk<string> {
        count = count + 1;

        return result.ok('ok');
      }

      const fnWithCache = withCache(fn);

      const response1 = await fnWithCache(true);

      expect(count).toBe(1);
      expect(response1.value).toBe('ok');

      const response2 = await fnWithCache(true);

      expect(count).toBe(2);
      expect(response2.value).toBe('ok');
    });
  });
});
