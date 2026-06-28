"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const zod_1 = require("zod");
const user_service_1 = require("./user.service");
const response_1 = require("../../utils/response");
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
    language: zod_1.z.enum(['fr', 'en', 'ar']).optional(),
});
const createEmployeeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(['owner', 'manager', 'cashier', 'server', 'chef', 'stock_manager']),
});
const updateEmployeeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
    role: zod_1.z.enum(['owner', 'manager', 'cashier', 'server', 'chef', 'stock_manager']).optional(),
    isActive: zod_1.z.boolean().optional(),
    password: zod_1.z.string().min(6).optional(),
});
function handleError(res, error) {
    if (error instanceof response_1.AppError) {
        (0, response_1.sendError)(res, error.statusCode, error.code, error.message);
        return;
    }
    (0, response_1.sendError)(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}
class UserController {
    static async updateProfile(req, res) {
        const result = updateProfileSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const user = await user_service_1.UserService.updateProfile(req.user.sub, result.data);
            (0, response_1.sendSuccess)(res, user);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async getEmployees(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
        const role = req.query.role;
        try {
            const { employees, total } = await user_service_1.UserService.getEmployees(page, limit, {
                isActive,
                role: role,
            });
            (0, response_1.sendSuccess)(res, employees, 200, {
                page,
                limit,
                total,
                hasMore: page * limit < total,
            });
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async createEmployee(req, res) {
        const result = createEmployeeSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const employee = await user_service_1.UserService.createEmployee(result.data, req.user.sub);
            (0, response_1.sendSuccess)(res, employee, 201);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async updateEmployee(req, res) {
        const result = updateEmployeeSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const employee = await user_service_1.UserService.updateEmployee(req.params.id, result.data, req.user.sub);
            (0, response_1.sendSuccess)(res, employee);
        }
        catch (error) {
            handleError(res, error);
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map