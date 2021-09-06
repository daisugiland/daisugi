import {
  withCache,
  buildCacheKey,
  calculateCacheMaxAgeMs,
  shouldInvalidateCache,
  shouldCache,
} from '../withCache';
import { result, ResultOK } from '../result';
import { SimpleMemoryStore } from '../SimpleMemoryStore';

describe('withCache', () => {
  it('should provide expected methods', () => {
    expect(typeof buildCacheKey).toBe('function');
    expect(typeof calculateCacheMaxAgeMs).toBe('function');
    expect(typeof shouldInvalidateCache).toBe('function');
    expect(typeof shouldCache).toBe('function');
  });

  it('should return expected response', async () => {
    let count = 0;

    async function fn() {
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

  describe('when async method is provided', () => {
    it('should return expected response', async () => {
      let count = 0;

      async function fn() {
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
  });

  it('should call cache store with proper parameters', async () => {
    const simpleMemoryStore = new SimpleMemoryStore();
    const getMock = jest.spyOn(simpleMemoryStore, 'get');
    const setMock = jest.spyOn(simpleMemoryStore, 'set');

    function fn(): ResultOK<string> {
      return result.ok('ok');
    }

    const fnWithCache = withCache(fn, {
      cacheStore: simpleMemoryStore,
    });

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

    function fn(): ResultOK<string> {
      return result.ok('ok');
    }

    const fnWithCache = withCache(fn, {
      cacheStore: simpleMemoryStore,
      version: 'v2',
      maxAgeMs: 1000,
      buildCacheKey(fnHash, version, args) {
        return `${fnHash}${version}${JSON.stringify(args)}`;
      },
      calculateCacheMaxAgeMs(maxAgeMs) {
        return maxAgeMs;
      },
    });

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

  describe('when `shouldInvalidateCache` returns true', () => {
    it('should invalidate cache', async () => {
      let count = 0;

      function fn(): ResultOK<string> {
        count = count + 1;

        return result.ok('ok');
      }

      const fnWithCache = withCache(fn, {
        shouldInvalidateCache(args) {
          return Boolean(args[0]);
        },
        buildCacheKey(_, __, ___) {
          return 'key';
        },
      });

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
      let count = 0;

      function fn(): ResultOK<string> {
        count = count + 1;

        return result.ok('ok');
      }

      const fnWithCache = withCache(fn, {
        shouldCache(response) {
          return response.value !== 'ok';
        },
      });

      const response1 = await fnWithCache(true);

      expect(count).toBe(1);
      expect(response1.value).toBe('ok');

      const response2 = await fnWithCache(true);

      expect(count).toBe(2);
      expect(response2.value).toBe('ok');
    });
  });
});
