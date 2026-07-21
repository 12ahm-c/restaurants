import mongoose, { Document } from 'mongoose';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery' | 'rental';
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'completed';
export interface IOrder extends Document {
    _id: mongoose.Types.ObjectId;
    orderNumber: string;
    branchId?: mongoose.Types.ObjectId;
    tentId?: mongoose.Types.ObjectId;
    customerId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: OrderType;
    status: OrderStatus;
    totalHT: number;
    totalTTC: number;
    rentalDuration?: string;
    rentalPrice?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Order: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Order.d.ts.map