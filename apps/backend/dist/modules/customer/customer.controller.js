"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const customer_service_1 = require("./customer.service");
const response_1 = require("../../utils/response");
const createCustomerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required').max(50),
    lastName: zod_1.z.string().max(50).optional(),
    phone: zod_1.z.string().min(1, 'Phone is required').max(20),
    email: zod_1.z.string().email().optional(),
    address: zod_1.z.string().max(200).optional(),
    preferences: zod_1.z.string().max(500).optional(),
    birthDate: zod_1.z.string().optional(),
    branchId: zod_1.z.string().optional(),
});
const updateCustomerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(50).optional(),
    lastName: zod_1.z.string().min(1).max(50).optional(),
    phone: zod_1.z.string().min(1).max(20).optional(),
    email: zod_1.z.string().email().optional(),
    address: zod_1.z.string().max(200).optional(),
    preferences: zod_1.z.string().max(500).optional(),
    birthDate: zod_1.z.string().optional(),
});
const redeemLoyaltySchema = zod_1.z.object({
    points: zod_1.z.number().min(1, 'Points must be positive'),
    orderId: zod_1.z.string().min(1, 'Order ID is required'),
});
function handleError(res, error) {
    if (error instanceof response_1.AppError) {
        (0, response_1.sendError)(res, error.statusCode, error.code, error.message);
        return;
    }
    if (error instanceof mongoose_1.default.Error.ValidationError) {
        const fields = Object.fromEntries(Object.entries(error.errors).map(([field, value]) => [field, value.message]));
        (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
        return;
    }
    if (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000) {
        (0, response_1.sendError)(res, 409, 'DUPLICATE', 'Duplicate value already exists');
        return;
    }
    (0, response_1.sendError)(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}
class CustomerController {
    static async getCustomers(req, res) {
        try {
            const result = await customer_service_1.CustomerService.getCustomers(req.query);
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
    static async getCustomerById(req, res) {
        try {
            const customer = await customer_service_1.CustomerService.getCustomerById(req.params.id);
            (0, response_1.sendSuccess)(res, customer);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async createCustomer(req, res) {
        const result = createCustomerSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.issues.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const customer = await customer_service_1.CustomerService.createCustomer(result.data);
            (0, response_1.sendSuccess)(res, customer, 201);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async updateCustomer(req, res) {
        const result = updateCustomerSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.issues.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const customer = await customer_service_1.CustomerService.updateCustomer(req.params.id, result.data);
            (0, response_1.sendSuccess)(res, customer);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async searchCustomers(req, res) {
        try {
            const { q } = req.query;
            if (!q || q.length < 2) {
                (0, response_1.sendSuccess)(res, []);
                return;
            }
            const customers = await customer_service_1.CustomerService.searchCustomers(q);
            (0, response_1.sendSuccess)(res, customers);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async redeemLoyaltyPoints(req, res) {
        const result = redeemLoyaltySchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.issues.forEach((e) => {
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
            const redemption = await customer_service_1.CustomerService.redeemLoyaltyPoints(req.params.id, result.data.points, result.data.orderId, userId);
            (0, response_1.sendSuccess)(res, redemption);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async getCustomerLoyaltyHistory(req, res) {
        try {
            const { page, limit } = req.query;
            const result = await customer_service_1.CustomerService.getCustomerLoyaltyHistory(req.params.id, {
                page: page,
                limit: limit,
            });
            (0, response_1.sendSuccess)(res, result.transactions, 200, {
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
    static async getCustomerPurchaseHistory(req, res) {
        try {
            const { page, limit } = req.query;
            const result = await customer_service_1.CustomerService.getCustomerPurchaseHistory(req.params.id, {
                page: page,
                limit: limit,
            });
            (0, response_1.sendSuccess)(res, result.orders, 200, {
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
    static async getLoyaltyRanking(req, res) {
        try {
            const { limit } = req.query;
            const ranking = await customer_service_1.CustomerService.getLoyaltyRanking(limit ? parseInt(limit, 10) : 20);
            (0, response_1.sendSuccess)(res, ranking);
        }
        catch (error) {
            handleError(res, error);
        }
    }
}
exports.CustomerController = CustomerController;
//# sourceMappingURL=customer.controller.js.map