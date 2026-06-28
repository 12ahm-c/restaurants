"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableController = void 0;
const zod_1 = require("zod");
const table_service_1 = require("./table.service");
const response_1 = require("../../utils/response");
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['free', 'occupied', 'reserved', 'in-service']),
    serverId: zod_1.z.string().optional(),
});
const createTableSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    capacity: zod_1.z.number().min(1, 'Capacity must be at least 1'),
    zone: zod_1.z.string().min(1, 'Zone is required'),
    position: zod_1.z.object({
        x: zod_1.z.number(),
        y: zod_1.z.number(),
    }),
});
function handleError(res, error) {
    if (error instanceof response_1.AppError) {
        (0, response_1.sendError)(res, error.statusCode, error.code, error.message);
        return;
    }
    (0, response_1.sendError)(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}
class TableController {
    static async getTables(req, res) {
        const status = req.query.status;
        const zone = req.query.zone;
        try {
            const tables = await table_service_1.TableService.getTables({
                status: status,
                zone,
            });
            (0, response_1.sendSuccess)(res, tables);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async getTableStatusSummary(_req, res) {
        try {
            const summary = await table_service_1.TableService.getTableStatusSummary();
            (0, response_1.sendSuccess)(res, summary);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async getTableById(req, res) {
        try {
            const table = await table_service_1.TableService.getTableById(req.params.id);
            (0, response_1.sendSuccess)(res, table);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async updateTableStatus(req, res) {
        const result = updateStatusSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const table = await table_service_1.TableService.updateTableStatus(req.params.id, result.data.status, result.data.serverId);
            (0, response_1.sendSuccess)(res, table);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async createTable(req, res) {
        const result = createTableSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const table = await table_service_1.TableService.createTable(result.data);
            (0, response_1.sendSuccess)(res, table, 201);
        }
        catch (error) {
            handleError(res, error);
        }
    }
}
exports.TableController = TableController;
//# sourceMappingURL=table.controller.js.map