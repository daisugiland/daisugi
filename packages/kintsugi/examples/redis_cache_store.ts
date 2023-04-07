import { Result } from '@daisugi/anzen';
import { Ayamari } from '@daisugi/ayamari';
// @ts-ignore
import IOREdis from 'ioredis';

import { CacheStore } from '../src/with_cache.js';

const { errFn } = new Ayamari();

export class RedisCacheStore implements CacheStore {
  #redisClient: IOREdis;

  constructor() {
    // For production environments, you should use a properly configured Redis client.
    this.#redisClient = new IOREdis({ host: '' });
  }

  async get(key: string) {
    try {
      const response = await this.#redisClient.get(key);
      if (response === null) {
        return Result.failure(
          errFn.NotFound('RedisCacheStore.get'),
        );
      }
      return Result.success(JSON.parse(response));
    } catch (err) {
      return Result.failure(
        errFn.UnexpectedError('RedisCacheStore.get', {
          cause: err,
        }),
      );
    }
  }

  async set(key: string, value: object, maxAgeMs: number) {
    try {
      const response = await this.#redisClient.set(
        key,
        JSON.stringify(value),
        'PX', // TTL in ms.
        maxAgeMs,
      );
      return Result.success(response);
    } catch (err) {
      return Result.failure(
        errFn.UnexpectedError('RedisCacheStore.set', {
          cause: err,
        }),
      );
    }
  }
}
