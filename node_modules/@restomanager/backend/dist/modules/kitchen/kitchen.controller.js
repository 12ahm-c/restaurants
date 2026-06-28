"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KitchenController = void 0;
const kitchen_service_1 = require("./kitchen.service");
const response_1 = require("../../utils/response");
class KitchenController {
    static async getQueue(req, res) {
        try {
            const { status, priority } = req.query;
            const queue = await kitchen_service_1.KitchenService.getQueue({
                status: status,
                priority: priority ? parseInt(priority) : undefined,
            });
            (0, response_1.sendSuccess)(res, queue);
        }
        catch (error) {
            if (error instanceof response_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    data: null,
                    error: { code: error.code, message: error.message },
                    meta: null,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    data: null,
                    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
                    meta: null,
                });
            }
        }
    }
    static async getPriorityQueue(_req, res) {
        try {
            const queue = await kitchen_service_1.KitchenService.getPriorityQueue();
            (0, response_1.sendSuccess)(res, queue);
        }
        catch (error) {
            if (error instanceof response_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    data: null,
                    error: { code: error.code, message: error.message },
                    meta: null,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    data: null,
                    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
                    meta: null,
                });
            }
        }
    }
    static async startPreparation(req, res) {
        try {
            const { id } = req.params;
            const entry = await kitchen_service_1.KitchenService.startPreparation(id);
            (0, response_1.sendSuccess)(res, entry);
        }
        catch (error) {
            if (error instanceof response_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    data: null,
                    error: { code: error.code, message: error.message },
                    meta: null,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    data: null,
                    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
                    meta: null,
                });
            }
        }
    }
    static async markReady(req, res) {
        try {
            const { id } = req.params;
            const entry = await kitchen_service_1.KitchenService.markReady(id);
            (0, response_1.sendSuccess)(res, entry);
        }
        catch (error) {
            if (error instanceof response_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    data: null,
                    error: { code: error.code, message: error.message },
                    meta: null,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    data: null,
                    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
                    meta: null,
                });
            }
        }
    }
    static async cancelOrder(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            await kitchen_service_1.KitchenService.cancelOrder(id, reason);
            (0, response_1.sendSuccess)(res, { message: 'Order cancelled successfully' });
        }
        catch (error) {
            if (error instanceof response_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    data: null,
                    error: { code: error.code, message: error.message },
                    meta: null,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    data: null,
                    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
                    meta: null,
                });
            }
        }
    }
}
exports.KitchenController = KitchenController;
//# sourceMappingURL=kitchen.controller.js.map