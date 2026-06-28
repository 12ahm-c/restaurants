"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogService = void 0;
const Log_1 = require("../../models/Log");
const mongoose_1 = __importDefault(require("mongoose"));
class LogService {
    static async getLogs(filters) {
        const { userId, action, from, to, cursor, limit = 50 } = filters;
        const query = {};
        if (userId) {
            query.userId = new mongoose_1.default.Types.ObjectId(userId);
        }
        if (action) {
            query.action = action;
        }
        if (from || to) {
            query.timestamp = {};
            if (from)
                query.timestamp.$gte = new Date(from);
            if (to)
                query.timestamp.$lte = new Date(to);
        }
        if (cursor) {
            query._id = { $lt: new mongoose_1.default.Types.ObjectId(cursor) };
        }
        const logs = await Log_1.Log.find(query)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .populate('userId', 'name email');
        const hasMore = logs.length > limit;
        const slicedLogs = hasMore ? logs.slice(0, limit) : logs;
        const nextCursor = hasMore ? slicedLogs[slicedLogs.length - 1]._id.toString() : null;
        return { logs: slicedLogs, nextCursor, hasMore };
    }
    static async createLog(data) {
        return Log_1.Log.createLog(data);
    }
}
exports.LogService = LogService;
//# sourceMappingURL=log.service.js.map