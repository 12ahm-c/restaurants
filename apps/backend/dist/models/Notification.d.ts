import mongoose, { Document } from 'mongoose';
export type NotificationType = 'new_order' | 'order_ready' | 'order_served' | 'payment_received' | 'stock_critical' | 'loyalty_earned' | 'manager_morning' | 'daily_summary' | 'system';
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