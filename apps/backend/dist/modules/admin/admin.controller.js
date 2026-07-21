"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const log_service_1 = require("./log.service");
class AdminController {
    static async getLogs(req, res) {
        try {
            const { cursor, limit, userId, action, from, to } = req.query;
            const result = await log_service_1.LogService.getLogs({
                cursor: cursor,
                limit: limit ? parseInt(limit) : 50,
                userId: userId,
                action: action,
                from: from,
                to: to,
            });
            res.json({
                success: true,
                data: result.logs,
                nextCursor: result.nextCursor,
                hasMore: result.hasMore,
            });
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to get logs' });
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=admin.controller.js.map