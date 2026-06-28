"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const log_service_1 = require("./log.service");
const Branch_1 = require("../../models/Branch");
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
    static async getBranches(req, res) {
        try {
            const branches = await Branch_1.Branch.find({ isActive: true }).sort({ name: 1 });
            res.json({ success: true, data: branches });
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to get branches' });
        }
    }
    static async createBranch(req, res) {
        try {
            const { name, address, phone } = req.body;
            const branch = await Branch_1.Branch.create({ name, address, phone });
            res.status(201).json({ success: true, data: branch });
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to create branch' });
        }
    }
    static async updateBranch(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const branch = await Branch_1.Branch.findByIdAndUpdate(id, updateData, { new: true });
            if (!branch) {
                res.status(404).json({ message: 'Branch not found' });
                return;
            }
            res.json({ success: true, data: branch });
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to update branch' });
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=admin.controller.js.map