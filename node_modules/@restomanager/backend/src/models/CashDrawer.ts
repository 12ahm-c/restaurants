import mongoose, { Document, Schema } from 'mongoose';

export type CashDrawerStatus = 'open' | 'closed';

export interface ICashDrawer extends Document {
  _id: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  status: CashDrawerStatus;
  openingBalance: number;
  currentBalance: number;
  closingBalance?: number;
  cashSales: number;
  cardSales: number;
  cashOut: number;
  openedBy: mongoose.Types.ObjectId;
  closedBy?: mongoose.Types.ObjectId;
  openedAt: Date;
  closedAt?: Date;
  difference?: number;
  createdAt: Date;
  updatedAt: Date;
}

const cashDrawerSchema = new Schema<ICashDrawer>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    status: { type: String, enum: ['open', 'closed'], required: true },
    openingBalance: { type: Number, required: true, min: 0 },
    currentBalance: { type: Number, required: true, min: 0 },
    closingBalance: { type: Number },
    cashSales: { type: Number, default: 0 },
    cardSales: { type: Number, default: 0 },
    cashOut: { type: Number, default: 0 },
    openedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    difference: { type: Number },
  },
  { timestamps: true }
);

cashDrawerSchema.index({ branchId: 1, status: 1 });
cashDrawerSchema.index({ openedAt: -1 });

export const CashDrawer = mongoose.model<ICashDrawer>('CashDrawer', cashDrawerSchema);
