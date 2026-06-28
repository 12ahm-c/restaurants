import mongoose, { Document } from 'mongoose';
export type SupplierDebtMovementType = 'purchase_debt' | 'payment' | 'adjustment';
export interface ISupplierDebtMovement extends Document {
    _id: mongoose.Types.ObjectId;
    supplierId: mongoose.Types.ObjectId;
    type: SupplierDebtMovementType;
    amount: number;
    previousBalance: number;
    newBalance: number;
    inventoryId?: mongoose.Types.ObjectId;
    stockMovementId?: mongoose.Types.ObjectId;
    description: string;
    userId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SupplierDebtMovement: mongoose.Model<ISupplierDebtMovement, {}, {}, {}, mongoose.Document<unknown, {}, ISupplierDebtMovement, {}, {}> & ISupplierDebtMovement & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=SupplierDebtMovement.d.ts.map