import mongoose, { Document } from 'mongoose';
export type MovementType = 'adjustment' | 'replenishment' | 'deduction' | 'waste';
export interface IStockMovement extends Document {
    _id: mongoose.Types.ObjectId;
    inventoryId: mongoose.Types.ObjectId;
    type: MovementType;
    quantity: number;
    previousQuantity: number;
    newQuantity: number;
    reason: string;
    userId: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    supplierId?: mongoose.Types.ObjectId;
    unitPrice?: number;
    paidSupplierPrice?: number;
    supplierAmountDue?: number;
    supplierDebtMovementId?: mongoose.Types.ObjectId;
    timestamp: Date;
}
export declare const StockMovement: mongoose.Model<IStockMovement, {}, {}, {}, mongoose.Document<unknown, {}, IStockMovement, {}, {}> & IStockMovement & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=StockMovement.d.ts.map