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
        if (times > 3) {
            return null; // Stop retrying silently
        }
        const delay = Math.min(times * 100, 2000);
        return delay;
    },
    enableOfflineQueue: false,
    lazyConnect: true,
});
exports.redis.on('connect', () => {
    redisAvailable = true;
    logger_1.logger.info('Connected to Redis');
});
exports.redis.on('error', () => {
    redisAvailable = false;
});
exports.redis.on('close', () => {
    redisAvailable = false;
});
// Try to connect, but don't crash if Redis is unavailable
exports.redis.connect().catch(() => {
    logger_1.logger.warn('Redis unavailable - running without cache');
});
function isRedisAvailable() {
    return redisAvailable && exports.redis.status === 'ready';
}
async function disconnectRedis() {
    await exports.redis.quit();
}
//# sourceMappingURL=redis.js.map