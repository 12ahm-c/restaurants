import mongoose, { Document } from 'mongoose';
export type NotificationType = 'order_ready' | 'stock_critical' | 'loyalty_earned' | 'loyalty_redeemed' | 'system' | 'payment_received';
export interface INotification extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    entity?: string;
    entityId?: mongoose.Types.ObjectId;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
export declare const Notification: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Notification.d.ts.map