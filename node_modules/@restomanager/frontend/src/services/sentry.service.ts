interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
}

class SentryService {
  private static initialized = false;

  static init(config?: Partial<SentryConfig>) {
    if (this.initialized) return;

    const dsn = config?.dsn || import.meta.env.VITE_SENTRY_DSN;
    if (!dsn) {
      console.warn('Sentry DSN not configured, error tracking disabled');
      return;
    }

    // In production, you would import * as Sentry from '@sentry/react' here
    // Sentry.init({
    //   dsn,
    //   environment: config?.environment || import.meta.env.MODE,
    //   integrations: [Sentry.browserTracingIntegration()],
    //   tracesSampleRate: 0.2,
    // });

    console.info('Sentry initialized (placeholder)');
    this.initialized = true;
  }

  static captureException(error: Error, context?: Record<string, unknown>) {
    if (!this.initialized) {
      console.error('Error captured (Sentry not configured):', error, context);
      return;
    }

    // Sentry.captureException(error, { extra: context });
    console.error('Error captured:', error);
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.initialized) {
      const logFn = level === 'warning' ? console.warn : level === 'error' ? console.error : console.info;
      logFn(`Message captured (Sentry not configured): ${message}`);
      return;
    }

    // Sentry.captureMessage(message, level);
    const logFn = level === 'warning' ? console.warn : level === 'error' ? console.error : console.info;
    logFn(`Message captured: ${message}`);
  }

  static setUser(user: { id: string; email?: string }) {
    if (!this.initialized) return;

    // Sentry.setUser(user);
    console.info('Sentry user context set:', user.id);
  }
}

export const sentry = SentryService;
