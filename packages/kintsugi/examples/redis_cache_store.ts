// @ts-ignore
import IOREdis from "ioredis";
import { Result } from "@daisugi/anzen";

import { CacheStore } from "../src/with_cache.js";
import { Code } from "../src/code.js";

export class RedisCacheStore implements CacheStore {
	#redisClient: IOREdis;

	constructor() {
		// For production environments, you should use a properly configured Redis client.
		this.#redisClient = new IOREdis({ host: "" });
	}

	async get(key: string) {
		try {
			const response = await this.#redisClient.get(key);
			if (response === null) {
				return Result.failure({
					code: Code.NotFound,
					message: `RedisCacheStore.get ${Code.NotFound}`,
				});
			}
			return Result.success(JSON.parse(response));
		} catch (error) {
			return Result.failure({
				code: Code.UnexpectedError,
				message: `RedisCacheStore.get ${(error as Error).message}`,
			});
		}
	}

	async set(key: string, value: object, maxAgeMs: number) {
		try {
			const response = await this.#redisClient.set(
				key,
				JSON.stringify(value),
				"PX", // TTL in ms.
				maxAgeMs,
			);
			return Result.success(response);
		} catch (error) {
			return Result.failure({
				code: Code.UnexpectedError,
				message: `RedisCacheStore.set ${(error as Error).message}`,
			});
		}
	}
}
