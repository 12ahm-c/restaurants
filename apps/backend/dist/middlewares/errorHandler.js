"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const zod_1 = require("zod");
const health_service_1 = require("../modules/health/health.service");
function errorHandler(err, req, res, _next) {
    health_service_1.healthService.incrementErrors();
    logger_1.logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
    if (err instanceof response_1.AppError) {
        (0, response_1.sendError)(res, err.statusCode, err.code, err.message, err.fields);
        return;
    }
    if (err instanceof zod_1.ZodError) {
        const fields = {};
        err.errors.forEach((e) => {
            const field = e.path.join('.');
            fields[field] = e.message;
        });
        (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
        return;
    }
    (0, response_1.sendError)(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}
//# sourceMappingURL=errorHandler.js.map