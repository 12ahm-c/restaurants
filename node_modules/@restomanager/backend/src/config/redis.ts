import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisAvailable = false;

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 10) {
      logger.warn('Redis: Max retries reached, running without cache');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableOfflineQueue: false,
});

redis.on('connect', () => {
  redisAvailable = true;
  logger.info('Connected to Redis');
});

redis.on('error', (error: Error) => {
  redisAvailable = false;
  logger.warn({ err: error.message }, 'Redis unavailable - running without cache');
});

redis.on('reconnecting', () => {
  logger.warn('Redis reconnecting');
});

export function isRedisAvailable(): boolean {
  return redisAvailable && redis.status === 'ready';
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info('Disconnected from Redis');
}
