import mongoose, { Document, Schema } from 'mongoose';

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

const kitchenQueueSchema = new Schema<IKitchenQueue>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'ready'],
      default: 'pending',
    },
    priority: { type: Number, default: 0, min: 0, max: 1 },
    startTime: { type: Date },
    endTime: { type: Date },
  },
  { timestamps: true }
);

kitchenQueueSchema.index({ status: 1 });
kitchenQueueSchema.index({ priority: -1 });

export const KitchenQueue = mongoose.model<IKitchenQueue>('KitchenQueue', kitchenQueueSchema);
