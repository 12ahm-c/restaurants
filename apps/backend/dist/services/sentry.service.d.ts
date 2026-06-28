interface SentryConfig {
    dsn: string;
    environment: string;
    release?: string;
}
declare class SentryService {
    private static initialized;
    static init(config?: Partial<SentryConfig>): void;
    static captureException(error: Error, context?: Record<string, unknown>): void;
    static captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void;
    static setUser(user: {
        id: string;
        email?: string;
        role?: string;
    }): void;
    static addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void;
}
export declare const sentry: typeof SentryService;
export {};
//# sourceMappingURL=sentry.service.d.ts.map