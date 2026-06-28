import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'new_order'
  | 'order_ready'
  | 'order_served'
  | 'payment_received'
  | 'stock_critical'
  | 'loyalty_earned'
  | 'system';

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

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['new_order', 'order_ready', 'order_served', 'payment_received', 'stock_critical', 'loyalty_earned', 'system'],
      required: true,
    },
    isRead: { type: Boolean, default: false },
    entity: { type: String },
    entityId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ isRead: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
