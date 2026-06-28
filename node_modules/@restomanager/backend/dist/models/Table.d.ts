import mongoose, { Document } from 'mongoose';
export type TableStatus = 'free' | 'occupied' | 'reserved' | 'in-service';
export interface ITable extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    branchId?: mongoose.Types.ObjectId;
    capacity: number;
    status: TableStatus;
    zone: string;
    position: {
        x: number;
        y: number;
    };
    currentOrderId?: mongoose.Types.ObjectId;
    serverId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Table: mongoose.Model<ITable, {}, {}, {}, mongoose.Document<unknown, {}, ITable, {}, {}> & ITable & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Table.d.ts.map