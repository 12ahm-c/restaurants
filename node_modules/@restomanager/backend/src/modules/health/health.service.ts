import mongoose from 'mongoose';
import { redis, isRedisAvailable } from '../../config/redis';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    mongodb: { status: string; latencyMs?: number };
    redis: { status: string; latencyMs?: number };
  };
}

export interface Metrics {
  timestamp: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  cpu: NodeJS.CpuUsage;
  activeConnections: number;
  requestsTotal: number;
  errorsTotal: number;
}

const startTime = Date.now();
let requestCount = 0;
let errorCount = 0;

export const healthService = {
  incrementRequests: () => { requestCount++; },
  incrementErrors: () => { errorCount++; },

  async check(): Promise<HealthStatus> {
    const services: HealthStatus['services'] = {
      mongodb: { status: 'unknown' },
      redis: { status: 'unknown' },
    };

    // Check MongoDB
    try {
      const mongoStart = Date.now();
      await mongoose.connection.db!.admin().ping();
      services.mongodb = { status: 'healthy', latencyMs: Date.now() - mongoStart };
    } catch {
      services.mongodb = { status: 'unhealthy' };
    }

    // Check Redis
    if (isRedisAvailable()) {
      try {
        const redisStart = Date.now();
        await redis.ping();
        services.redis = { status: 'healthy', latencyMs: Date.now() - redisStart };
      } catch {
        services.redis = { status: 'unhealthy' };
      }
    } else {
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

  getMetrics(): Metrics {
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
