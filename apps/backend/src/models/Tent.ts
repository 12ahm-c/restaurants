import mongoose, { Document, Schema } from 'mongoose';

export type TentStatus = 'free' | 'occupied' | 'reserved' | 'cleaning';
export type TentSize = 'small' | 'medium' | 'large';

export interface ITent extends Document {
  _id: mongoose.Types.ObjectId;
  tentNumber: number;
  size: TentSize;
  branchId?: mongoose.Types.ObjectId;
  status: TentStatus;
  position: { x: number; y: number };
  currentOrderId?: mongoose.Types.ObjectId;
  serverId?: mongoose.Types.ObjectId;
  isEmpty: boolean;
  lastEmptiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const tentSchema = new Schema<ITent>(
  {
    tentNumber: { type: Number, required: true, unique: true },
    size: { type: String, enum: ['small', 'medium', 'large'], required: true, default: 'medium' },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    status: {
      type: String,
      enum: ['free', 'occupied', 'reserved', 'cleaning'],
      default: 'free',
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    currentOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    serverId: { type: Schema.Types.ObjectId, ref: 'User' },
    isEmpty: { type: Boolean, default: true },
    lastEmptiedAt: { type: Date },
  },
  { timestamps: true }
);

tentSchema.index({ status: 1 });
tentSchema.index({ branchId: 1 });

export const Tent = mongoose.model<ITent>('Tent', tentSchema);
