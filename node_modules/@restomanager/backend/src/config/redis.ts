import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisAvailable = false;

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) {
      return null; // Stop retrying silently
    }
    const delay = Math.min(times * 100, 2000);
    return delay;
  },
  enableOfflineQueue: false,
  lazyConnect: true,
});

redis.on('connect', () => {
  redisAvailable = true;
  logger.info('Connected to Redis');
});

redis.on('error', () => {
  redisAvailable = false;
});

redis.on('close', () => {
  redisAvailable = false;
});

// Try to connect, but don't crash if Redis is unavailable
redis.connect().catch(() => {
  logger.warn('Redis unavailable - running without cache');
});

export function isRedisAvailable(): boolean {
  return redisAvailable && redis.status === 'ready';
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}
