import mongoose, { Document } from 'mongoose';
export type LoyaltyTransactionType = 'earn' | 'redeem' | 'adjustment';
export interface ILoyaltyTransaction extends Document {
    _id: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    type: LoyaltyTransactionType;
    points: number;
    orderId?: mongoose.Types.ObjectId;
    description: string;
    userId: mongoose.Types.ObjectId;
    timestamp: Date;
}
export declare const LoyaltyTransaction: mongoose.Model<ILoyaltyTransaction, {}, {}, {}, mongoose.Document<unknown, {}, ILoyaltyTransaction, {}, {}> & ILoyaltyTransaction & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=LoyaltyTransaction.d.ts.map