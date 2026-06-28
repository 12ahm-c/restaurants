import mongoose, { Document } from 'mongoose';
export type CashDrawerStatus = 'open' | 'closed';
export interface ICashDrawer extends Document {
    _id: mongoose.Types.ObjectId;
    branchId: mongoose.Types.ObjectId;
    status: CashDrawerStatus;
    openingBalance: number;
    currentBalance: number;
    closingBalance?: number;
    cashSales: number;
    cardSales: number;
    cashOut: number;
    openedBy: mongoose.Types.ObjectId;
    closedBy?: mongoose.Types.ObjectId;
    openedAt: Date;
    closedAt?: Date;
    difference?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const CashDrawer: mongoose.Model<ICashDrawer, {}, {}, {}, mongoose.Document<unknown, {}, ICashDrawer, {}, {}> & ICashDrawer & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=CashDrawer.d.ts.map