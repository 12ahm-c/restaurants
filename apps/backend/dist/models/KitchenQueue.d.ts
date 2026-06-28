import mongoose, { Document } from 'mongoose';
export type KitchenStatus = 'pending' | 'preparing' | 'ready';
export interface IKitchenQueue extends Document {
    _id: mongoose.Types.ObjectId;
    orderId: mongoose.Types.ObjectId;
    status: KitchenStatus;
    priority: number;
    startTime?: Date;
    endTime?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const KitchenQueue: mongoose.Model<IKitchenQueue, {}, {}, {}, mongoose.Document<unknown, {}, IKitchenQueue, {}, {}> & IKitchenQueue & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=KitchenQueue.d.ts.map