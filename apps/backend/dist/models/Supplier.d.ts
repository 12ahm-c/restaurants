import mongoose, { Document } from 'mongoose';
export interface ISupplier extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    phone?: string;
    email?: string;
    balanceDue: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Supplier: mongoose.Model<ISupplier, {}, {}, {}, mongoose.Document<unknown, {}, ISupplier, {}, {}> & ISupplier & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Supplier.d.ts.map