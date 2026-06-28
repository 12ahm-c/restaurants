"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Supplier_1 = require("../../models/Supplier");
const SupplierDebtMovement_1 = require("../../models/SupplierDebtMovement");
const response_1 = require("../../utils/response");
class SupplierService {
    static async getSuppliers(search) {
        const filter = { isActive: true };
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        return Supplier_1.Supplier.find(filter).sort({ name: 1 });
    }
    static async createSupplier(data) {
        const existing = await Supplier_1.Supplier.findOne({ name: data.name.trim(), isActive: true });
        if (existing) {
            throw new response_1.AppError(409, 'DUPLICATE', 'Supplier already exists');
        }
        return Supplier_1.Supplier.create({
            name: data.name.trim(),
            phone: data.phone,
            email: data.email,
        });
    }
    static async getSupplierMovements(supplierId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(supplierId)) {
            throw new response_1.AppError(400, 'INVALID_ID', 'Invalid supplier ID');
        }
        return SupplierDebtMovement_1.SupplierDebtMovement.find({ supplierId }).sort({ createdAt: -1 }).limit(100);
    }
}
exports.SupplierService = SupplierService;
//# sourceMappingURL=supplier.service.js.map