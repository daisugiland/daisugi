import Redis from 'ioredis';
import Redlock from 'redlock';

import { withCache, CacheStore, CacheLockClient, CacheLockResult } from '../withCache';
import { result } from '../result';
import { Code } from '../Code';


const redisClient = new Redis({
  host: '',
});

class RedisCacheLockClient implements CacheLockClient {

  private redlock: Redlock;

  constructor() {
    this.redlock = new Redlock([redisClient]);
  }

  async acquire(cacheKey: string, duration: number): Promise<CacheLockResult> {
    try {
      const lock = await this.redlock.acquire([cacheKey], duration);
      return result.ok(lock);
    } catch(error) {
      return result.fail({
        code: Code.UnexpectedError,
        message: `RedisCacheLockClient.acquire ${error}`,
      })
    }
  }
}

class RedisCacheStore implements CacheStore {
  private redisClient: Redis.Redis;

  constructor() {
    // For production environments, you should use a properly configured Redis client.
    this.redisClient = redisClient;
  }

  async get(key: string) {
    try {
      const response = await this.redisClient.get(key);

      if (response === null) {
        return result.fail({
          code: Code.NotFound,
          message: `RedisCacheStore.get ${Code.NotFound}`,
        });
      }

      return result.ok(JSON.parse(response));
    } catch (error) {
      return result.fail({
        code: Code.UnexpectedError,
        message: `RedisCacheStore.get ${error.message}`,
      });
    }
  }

  async set(key: string, value: object, maxAgeMs: number) {
    try {
      const response = await this.redisClient.set(
        key,
        JSON.stringify(value),
        'PX', // TTL in ms.
        maxAgeMs,
      );

      return result.ok(response);
    } catch (error) {
      return result.fail({
        code: Code.UnexpectedError,
        message: `RedisCacheStore.set ${error.message}`,
      });
    }
  }
}

function fn() {
  return result.ok('Hi Benadryl Cumberbatch.');
}

const fnWithCache = withCache(fn, {
  cacheStore: new RedisCacheStore(),
  cacheLockClient: new RedisCacheLockClient(),
});

fn();
