export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    services: {
        mongodb: {
            status: string;
            latencyMs?: number;
        };
        redis: {
            status: string;
            latencyMs?: number;
        };
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
export declare const healthService: {
    incrementRequests: () => void;
    incrementErrors: () => void;
    check(): Promise<HealthStatus>;
    getMetrics(): Metrics;
};
//# sourceMappingURL=health.service.d.ts.map