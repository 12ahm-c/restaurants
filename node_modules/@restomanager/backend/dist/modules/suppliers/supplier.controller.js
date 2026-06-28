"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierController = void 0;
const zod_1 = require("zod");
const supplier_service_1 = require("./supplier.service");
const response_1 = require("../../utils/response");
const createSupplierSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(120),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
});
function handleError(res, error) {
    if (error instanceof response_1.AppError) {
        (0, response_1.sendError)(res, error.statusCode, error.code, error.message);
        return;
    }
    (0, response_1.sendError)(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}
class SupplierController {
    static async getSuppliers(req, res) {
        try {
            const suppliers = await supplier_service_1.SupplierService.getSuppliers(req.query.search);
            (0, response_1.sendSuccess)(res, suppliers);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async createSupplier(req, res) {
        const result = createSupplierSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const supplier = await supplier_service_1.SupplierService.createSupplier(result.data);
            (0, response_1.sendSuccess)(res, supplier, 201);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async getSupplierMovements(req, res) {
        try {
            const movements = await supplier_service_1.SupplierService.getSupplierMovements(req.params.id);
            (0, response_1.sendSuccess)(res, movements);
        }
        catch (error) {
            handleError(res, error);
        }
    }
}
exports.SupplierController = SupplierController;
//# sourceMappingURL=supplier.controller.js.map