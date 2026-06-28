"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = require("../../config/redis");
const startTime = Date.now();
let requestCount = 0;
let errorCount = 0;
exports.healthService = {
    incrementRequests: () => { requestCount++; },
    incrementErrors: () => { errorCount++; },
    async check() {
        const services = {
            mongodb: { status: 'unknown' },
            redis: { status: 'unknown' },
        };
        // Check MongoDB
        try {
            const mongoStart = Date.now();
            await mongoose_1.default.connection.db.admin().ping();
            services.mongodb = { status: 'healthy', latencyMs: Date.now() - mongoStart };
        }
        catch {
            services.mongodb = { status: 'unhealthy' };
        }
        // Check Redis
        if ((0, redis_1.isRedisAvailable)()) {
            try {
                const redisStart = Date.now();
                await redis_1.redis.ping();
                services.redis = { status: 'healthy', latencyMs: Date.now() - redisStart };
            }
            catch {
                services.redis = { status: 'unhealthy' };
            }
        }
        else {
            services.redis = { status: 'unavailable' };
        }
        const allHealthy = Object.values(services).every((s) => s.status === 'healthy');
        const anyUnhealthy = Object.values(services).some((s) => s.status === 'unhealthy');
        return {
            status: anyUnhealthy ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - startTime) / 1000),
            services,
        };
    },
    getMetrics() {
        return {
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - startTime) / 1000),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            activeConnections: 0,
            requestsTotal: requestCount,
            errorsTotal: errorCount,
        };
    },
};
//# sourceMappingURL=health.service.js.map