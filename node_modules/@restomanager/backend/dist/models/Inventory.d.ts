import mongoose, { Document } from 'mongoose';
export interface IInventory extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    category: string;
    unit: string;
    quantity: number;
    threshold: number;
    unitPrice: number;
    supplier?: string;
    supplierId?: mongoose.Types.ObjectId;
    expiryDate?: Date;
    branchId?: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Inventory: mongoose.Model<IInventory, {}, {}, {}, mongoose.Document<unknown, {}, IInventory, {}, {}> & IInventory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Inventory.d.ts.map