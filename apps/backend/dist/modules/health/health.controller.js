"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = void 0;
const health_service_1 = require("./health.service");
const response_1 = require("../../utils/response");
exports.healthController = {
    async check(_req, res) {
        const status = await health_service_1.healthService.check();
        const statusCode = status.status === 'healthy' ? 200 : status.status === 'degraded' ? 200 : 503;
        res.status(statusCode).json(status);
    },
    async metrics(_req, res) {
        const metrics = health_service_1.healthService.getMetrics();
        (0, response_1.sendSuccess)(res, metrics);
    },
};
//# sourceMappingURL=health.controller.js.map