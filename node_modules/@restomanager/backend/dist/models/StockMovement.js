"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovement = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const stockMovementSchema = new mongoose_1.Schema({
    inventoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    type: {
        type: String,
        enum: ['adjustment', 'replenishment', 'deduction', 'waste'],
        required: true,
    },
    quantity: { type: Number, required: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    reason: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Order' },
    supplierId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Supplier' },
    unitPrice: { type: Number, min: 0 },
    paidSupplierPrice: { type: Number, min: 0 },
    supplierAmountDue: { type: Number, min: 0 },
    supplierDebtMovementId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'SupplierDebtMovement' },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });
stockMovementSchema.index({ inventoryId: 1 });
stockMovementSchema.index({ timestamp: -1 });
stockMovementSchema.index({ type: 1 });
stockMovementSchema.index({ supplierId: 1 });
exports.StockMovement = mongoose_1.default.model('StockMovement', stockMovementSchema);
//# sourceMappingURL=StockMovement.js.map