import mongoose, { Document, Schema } from 'mongoose';

export type PaymentMethod = 'cash' | 'card' | 'mobile';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  cashGiven?: number;
  changeAmount: number;
  userId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['cash', 'card', 'mobile'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    transactionId: { type: String },
    cashGiven: { type: Number },
    changeAmount: { type: Number, default: 0 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ branchId: 1, createdAt: -1 });
paymentSchema.index({ branchId: 1, method: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
