import mongoose, { Document, Schema } from 'mongoose';

export type OrderType = 'dine-in' | 'takeaway' | 'delivery';
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'completed';

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  branchId?: mongoose.Types.ObjectId;
  tableId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: OrderType;
  status: OrderStatus;
  totalHT: number;
  totalTTC: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, unique: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['dine-in', 'takeaway', 'delivery'],
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'preparing', 'ready', 'served', 'cancelled', 'completed'],
      default: 'new',
    },
    totalHT: { type: Number, required: true, min: 0 },
    totalTTC: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1 });
orderSchema.index({ tableId: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ branchId: 1, status: 1 });
orderSchema.index({ branchId: 1, createdAt: -1 });
orderSchema.index({ customerId: 1, createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
