"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const menu_service_1 = require("./menu.service");
const response_1 = require("../../utils/response");
const optionalObjectIdSchema = zod_1.z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), zod_1.z
    .string()
    .refine((value) => mongoose_1.default.Types.ObjectId.isValid(value), 'Invalid ObjectId')
    .optional());
const getProductsSchema = zod_1.z.object({
    categoryId: optionalObjectIdSchema,
    status: zod_1.z.enum(['available', 'unavailable', 'discontinued']).optional(),
    search: zod_1.z.string().optional(),
    minPrice: zod_1.z.coerce.number().min(0).optional(),
    maxPrice: zod_1.z.coerce.number().min(0).optional(),
    sortBy: zod_1.z.enum(['name', 'price', 'createdAt']).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    page: zod_1.z.coerce.number().min(1).optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).optional(),
});
const createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100),
    description: zod_1.z.string().max(500).optional(),
    categoryId: zod_1.z.string().min(1, 'Category is required'),
    price: zod_1.z.number().min(0, 'Price must be positive'),
    prepTime: zod_1.z.number().min(0).optional(),
    imageUrl: zod_1.z.string().url().optional(),
    recipe: zod_1.z
        .array(zod_1.z.object({
        inventoryId: zod_1.z.string(),
        quantity: zod_1.z.number().min(0.01),
    }))
        .optional(),
});
const updateProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    categoryId: zod_1.z.string().optional(),
    price: zod_1.z.number().min(0).optional(),
    prepTime: zod_1.z.number().min(0).optional(),
    status: zod_1.z.enum(['available', 'unavailable', 'discontinued']).optional(),
    imageUrl: zod_1.z.string().url().optional(),
    recipe: zod_1.z
        .array(zod_1.z.object({
        inventoryId: zod_1.z.string(),
        quantity: zod_1.z.number().min(0.01),
    }))
        .optional(),
});
const createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(50),
    sortOrder: zod_1.z.number().min(0).optional(),
});
const updateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50).optional(),
    sortOrder: zod_1.z.number().min(0).optional(),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['available', 'unavailable']),
});
function handleError(res, error) {
    if (error instanceof response_1.AppError) {
        (0, response_1.sendError)(res, error.statusCode, error.code, error.message);
        return;
    }
    (0, response_1.sendError)(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}
class MenuController {
    static async getProducts(req, res) {
        const result = getProductsSchema.safeParse(req.query);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const { products, total } = await menu_service_1.MenuService.getProducts(result.data);
            (0, response_1.sendSuccess)(res, products, 200, {
                page: result.data.page || 1,
                limit: result.data.limit || 20,
                total,
                hasMore: (result.data.page || 1) * (result.data.limit || 20) < total,
            });
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async getProductById(req, res) {
        try {
            const result = await menu_service_1.MenuService.getProductById(req.params.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async getCategories(_req, res) {
        try {
            const categories = await menu_service_1.MenuService.getCategories();
            (0, response_1.sendSuccess)(res, categories);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async createCategory(req, res) {
        const result = createCategorySchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const category = await menu_service_1.MenuService.createCategory(result.data);
            (0, response_1.sendSuccess)(res, category, 201);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async updateCategory(req, res) {
        const result = updateCategorySchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const category = await menu_service_1.MenuService.updateCategory(req.params.id, result.data);
            (0, response_1.sendSuccess)(res, category);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async deleteCategory(req, res) {
        try {
            await menu_service_1.MenuService.deleteCategory(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async createProduct(req, res) {
        const result = createProductSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const product = await menu_service_1.MenuService.createProduct(result.data);
            (0, response_1.sendSuccess)(res, product, 201);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async updateProduct(req, res) {
        const result = updateProductSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const product = await menu_service_1.MenuService.updateProduct(req.params.id, result.data);
            (0, response_1.sendSuccess)(res, product);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async updateProductStatus(req, res) {
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
            const product = await menu_service_1.MenuService.updateProductStatus(req.params.id, result.data.status);
            (0, response_1.sendSuccess)(res, product);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async deleteProduct(req, res) {
        try {
            await menu_service_1.MenuService.deleteProduct(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            handleError(res, error);
        }
    }
}
exports.MenuController = MenuController;
//# sourceMappingURL=menu.controller.js.map