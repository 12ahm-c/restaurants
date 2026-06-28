import { env } from '../config/env';
import { logger } from '../utils/logger';

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
}

class SentryService {
  private static initialized = false;

  static init(config?: Partial<SentryConfig>) {
    if (this.initialized) return;

    const dsn = config?.dsn || process.env.SENTRY_DSN;
    if (!dsn) {
      logger.warn('Sentry DSN not configured, error tracking disabled');
      return;
    }

    // In production, you would import @sentry/node here
    // For now, we just log the configuration
    logger.info({
      dsn: dsn.replace(/\/\/.*@/, '//***@'),
      environment: config?.environment || env.NODE_ENV,
    }, 'Sentry initialized');

    this.initialized = true;
  }

  static captureException(error: Error, context?: Record<string, unknown>) {
    if (!this.initialized) {
      logger.error({ err: error, ...context }, 'Error captured (Sentry not configured)');
      return;
    }

    // In production, you would call Sentry.captureException(error, { extra: context })
    logger.error({ err: error, ...context }, 'Error captured');
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.initialized) {
      const logLevel = level === 'warning' ? 'warn' : level;
      logger[logLevel]({ message }, 'Message captured (Sentry not configured)');
      return;
    }

    // In production, you would call Sentry.captureMessage(message, level)
    const logLevel = level === 'warning' ? 'warn' : level;
    logger[logLevel]({ message }, 'Message captured');
  }

  static setUser(user: { id: string; email?: string; role?: string }) {
    if (!this.initialized) return;

    // In production, you would call Sentry.setUser(user)
    logger.info({ userId: user.id }, 'Sentry user context set');
  }

  static addBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
    if (!this.initialized) return;

    // In production, you would call Sentry.addBreadcrumb({ category, message, data })
    logger.debug({ category, message, data }, 'Sentry breadcrumb');
  }
}

export const sentry = SentryService;
