"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.isRedisAvailable = isRedisAvailable;
exports.disconnectRedis = disconnectRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
let redisAvailable = false;
exports.redis = new ioredis_1.default(env_1.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 10) {
            logger_1.logger.warn('Redis: Max retries reached, running without cache');
            return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    enableOfflineQueue: false,
});
exports.redis.on('connect', () => {
    redisAvailable = true;
    logger_1.logger.info('Connected to Redis');
});
exports.redis.on('error', (error) => {
    redisAvailable = false;
    logger_1.logger.warn({ err: error.message }, 'Redis unavailable - running without cache');
});
exports.redis.on('reconnecting', () => {
    logger_1.logger.warn('Redis reconnecting');
});
function isRedisAvailable() {
    return redisAvailable && exports.redis.status === 'ready';
}
async function disconnectRedis() {
    await exports.redis.quit();
    logger_1.logger.info('Disconnected from Redis');
}
//# sourceMappingURL=redis.js.map