import mongoose, { Document, Schema } from 'mongoose';

export type LoyaltyTransactionType = 'earn' | 'redeem' | 'adjustment';

export interface ILoyaltyTransaction extends Document {
  _id: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  type: LoyaltyTransactionType;
  points: number;
  orderId?: mongoose.Types.ObjectId;
  description: string;
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
}

const loyaltyTransactionSchema = new Schema<ILoyaltyTransaction>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    type: {
      type: String,
      enum: ['earn', 'redeem', 'adjustment'],
      required: true,
    },
    points: { type: Number, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    description: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

loyaltyTransactionSchema.index({ customerId: 1 });
loyaltyTransactionSchema.index({ timestamp: -1 });

export const LoyaltyTransaction = mongoose.model<ILoyaltyTransaction>(
  'LoyaltyTransaction',
  loyaltyTransactionSchema
);
