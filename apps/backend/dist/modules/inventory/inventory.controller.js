"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const inventory_service_1 = require("./inventory.service");
const response_1 = require("../../utils/response");
const optionalObjectIdSchema = zod_1.z
    .string()
    .refine((value) => mongoose_1.default.Types.ObjectId.isValid(value), 'Invalid ObjectId')
    .optional();
const createInventorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100),
    category: zod_1.z.string().min(1, 'Category is required'),
    unit: zod_1.z.string().min(1, 'Unit is required'),
    quantity: zod_1.z.number().min(0, 'Quantity must be positive'),
    threshold: zod_1.z.number().min(0, 'Threshold must be positive'),
    unitPrice: zod_1.z.number().min(0, 'Unit price must be positive'),
    branchId: zod_1.z.string().optional(),
    supplier: zod_1.z.string().optional(),
    supplierId: optionalObjectIdSchema,
    expiryDate: zod_1.z.string().optional(),
});
const adjustStockSchema = zod_1.z.object({
    quantity: zod_1.z.number(),
    type: zod_1.z.enum(['adjustment', 'replenishment', 'deduction', 'waste']),
    reason: zod_1.z.string().min(1, 'Reason is required'),
});
const incrementStockSchema = zod_1.z.object({
    quantity: zod_1.z.number().min(1, 'Quantity must be positive'),
    unitPrice: zod_1.z.number().min(0).optional(),
    supplier: zod_1.z.string().optional(),
    supplierId: optionalObjectIdSchema,
    paidSupplierPrice: zod_1.z.number().min(0).optional(),
});
function handleError(res, error) {
    if (error instanceof response_1.AppError) {
        (0, response_1.sendError)(res, error.statusCode, error.code, error.message);
        return;
    }
    (0, response_1.sendError)(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}
class InventoryController {
    static async getInventory(req, res) {
        try {
            const result = await inventory_service_1.InventoryService.getInventoryItems(req.query);
            (0, response_1.sendSuccess)(res, result.items, 200, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                hasMore: result.page * result.limit < result.total,
            });
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async getInventoryById(req, res) {
        try {
            const item = await inventory_service_1.InventoryService.getInventoryById(req.params.id);
            (0, response_1.sendSuccess)(res, item);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async getStockAlerts(req, res) {
        try {
            const { branchId } = req.query;
            const alerts = await inventory_service_1.InventoryService.getStockAlerts(branchId);
            (0, response_1.sendSuccess)(res, alerts);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async createInventory(req, res) {
        const result = createInventorySchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const item = await inventory_service_1.InventoryService.createInventoryItem(result.data);
            (0, response_1.sendSuccess)(res, item, 201);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async adjustStock(req, res) {
        const result = adjustStockSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const userId = req.user?.sub;
            if (!userId) {
                (0, response_1.sendError)(res, 401, 'AUTH_REQUIRED', 'Authentication required');
                return;
            }
            const adjustment = await inventory_service_1.InventoryService.adjustStock(req.params.id, result.data, userId);
            (0, response_1.sendSuccess)(res, adjustment);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async incrementStock(req, res) {
        const result = incrementStockSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const userId = req.user?.sub;
            if (!userId) {
                (0, response_1.sendError)(res, 401, 'AUTH_REQUIRED', 'Authentication required');
                return;
            }
            const adjustment = await inventory_service_1.InventoryService.incrementStock(req.params.id, result.data.quantity, userId, result.data.unitPrice, result.data.supplier, result.data.supplierId, result.data.paidSupplierPrice);
            (0, response_1.sendSuccess)(res, adjustment);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async getStockValue(req, res) {
        try {
            const { branchId } = req.query;
            const result = await inventory_service_1.InventoryService.getStockValue(branchId);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async getStockMovements(req, res) {
        try {
            const { page, limit } = req.query;
            const result = await inventory_service_1.InventoryService.getStockMovements(req.params.id, {
                page: page,
                limit: limit,
            });
            (0, response_1.sendSuccess)(res, result.movements, 200, {
                page: parseInt(page || '1', 10),
                limit: parseInt(limit || '20', 10),
                total: result.total,
                hasMore: parseInt(page || '1', 10) * parseInt(limit || '20', 10) < result.total,
            });
        }
        catch (error) {
            handleError(res, error);
        }
    }
}
exports.InventoryController = InventoryController;
//# sourceMappingURL=inventory.controller.js.map