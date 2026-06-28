import mongoose, { Document } from 'mongoose';
export type PaymentMethod = 'cash' | 'card' | 'mobile';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export interface IPayment extends Document {
    _id: mongoose.Types.ObjectId;
    orderId: mongoose.Types.ObjectId;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
    cashGiven?: number;
    changeAmount: number;
    userId: mongoose.Types.ObjectId;
    branchId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Payment.d.ts.map