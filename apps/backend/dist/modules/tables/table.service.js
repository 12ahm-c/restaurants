"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableService = void 0;
const Table_1 = require("../../models/Table");
const Order_1 = require("../../models/Order");
const response_1 = require("../../utils/response");
class TableService {
    static async getTables(filters) {
        const query = {};
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.zone) {
            query.zone = filters.zone;
        }
        return Table_1.Table.find(query).sort({ name: 1 });
    }
    static async getTableStatusSummary() {
        const [free, occupied, reserved, inService, total] = await Promise.all([
            Table_1.Table.countDocuments({ status: 'free' }),
            Table_1.Table.countDocuments({ status: 'occupied' }),
            Table_1.Table.countDocuments({ status: 'reserved' }),
            Table_1.Table.countDocuments({ status: 'in-service' }),
            Table_1.Table.countDocuments(),
        ]);
        return { free, occupied, reserved, inService, total };
    }
    static async getTableById(id) {
        const table = await Table_1.Table.findById(id);
        if (!table) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Table not found');
        }
        return table;
    }
    static async updateTableStatus(id, status, serverId) {
        const table = await Table_1.Table.findById(id);
        if (!table) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Table not found');
        }
        table.status = status;
        if (serverId) {
            table.serverId = table.serverId || table.serverId;
        }
        await table.save();
        return table;
    }
    static async clearTable(id) {
        const table = await Table_1.Table.findById(id);
        if (!table) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Table not found');
        }
        if (table.status === 'free') {
            throw new response_1.AppError(409, 'INVALID_STATE', 'Table is already free');
        }
        if (table.currentOrderId) {
            await Order_1.Order.findByIdAndUpdate(table.currentOrderId, { status: 'completed' });
        }
        table.status = 'free';
        table.currentOrderId = undefined;
        table.serverId = undefined;
        await table.save();
        return table;
    }
    static async createTable(data) {
        return Table_1.Table.create({
            ...data,
            status: 'free',
        });
    }
}
exports.TableService = TableService;
//# sourceMappingURL=table.service.js.map