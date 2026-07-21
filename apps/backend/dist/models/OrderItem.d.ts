import mongoose, { Document } from 'mongoose';
export interface IOrderOption {
    name: string;
    price: number;
}
export interface IOrderItem extends Document {
    _id: mongoose.Types.ObjectId;
    orderId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    variant?: string;
    quantity: number;
    unitPrice: number;
    options: IOrderOption[];
    quantityTypeName?: string;
    quantityTypeLabel?: string;
    notes?: string;
    total: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const OrderItem: mongoose.Model<IOrderItem, {}, {}, {}, mongoose.Document<unknown, {}, IOrderItem, {}, {}> & IOrderItem & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=OrderItem.d.ts.map