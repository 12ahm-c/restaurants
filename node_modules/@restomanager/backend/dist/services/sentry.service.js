"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sentry = void 0;
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class SentryService {
    static initialized = false;
    static init(config) {
        if (this.initialized)
            return;
        const dsn = config?.dsn || process.env.SENTRY_DSN;
        if (!dsn) {
            logger_1.logger.warn('Sentry DSN not configured, error tracking disabled');
            return;
        }
        // In production, you would import @sentry/node here
        // For now, we just log the configuration
        logger_1.logger.info({
            dsn: dsn.replace(/\/\/.*@/, '//***@'),
            environment: config?.environment || env_1.env.NODE_ENV,
        }, 'Sentry initialized');
        this.initialized = true;
    }
    static captureException(error, context) {
        if (!this.initialized) {
            logger_1.logger.error({ err: error, ...context }, 'Error captured (Sentry not configured)');
            return;
        }
        // In production, you would call Sentry.captureException(error, { extra: context })
        logger_1.logger.error({ err: error, ...context }, 'Error captured');
    }
    static captureMessage(message, level = 'info') {
        if (!this.initialized) {
            const logLevel = level === 'warning' ? 'warn' : level;
            logger_1.logger[logLevel]({ message }, 'Message captured (Sentry not configured)');
            return;
        }
        // In production, you would call Sentry.captureMessage(message, level)
        const logLevel = level === 'warning' ? 'warn' : level;
        logger_1.logger[logLevel]({ message }, 'Message captured');
    }
    static setUser(user) {
        if (!this.initialized)
            return;
        // In production, you would call Sentry.setUser(user)
        logger_1.logger.info({ userId: user.id }, 'Sentry user context set');
    }
    static addBreadcrumb(category, message, data) {
        if (!this.initialized)
            return;
        // In production, you would call Sentry.addBreadcrumb({ category, message, data })
        logger_1.logger.debug({ category, message, data }, 'Sentry breadcrumb');
    }
}
exports.sentry = SentryService;
//# sourceMappingURL=sentry.service.js.map