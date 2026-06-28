import mongoose, { Document, Schema } from 'mongoose';

export type ExpenseCategory = 'salary' | 'rent' | 'electricity' | 'water' | 'gas' | 'internet' | 'maintenance' | 'supplies' | 'marketing' | 'insurance' | 'tax' | 'other';

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  category: ExpenseCategory;
  vendor?: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'check';
  receiptUrl?: string;
  notes?: string;
  userId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  date: Date;
  isRecurring: boolean;
  recurringPeriod?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ['salary', 'rent', 'electricity', 'water', 'gas', 'internet', 'maintenance', 'supplies', 'marketing', 'insurance', 'tax', 'other'],
      required: true,
    },
    vendor: { type: String, trim: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'check'],
      default: 'cash',
    },
    receiptUrl: { type: String },
    notes: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    date: { type: Date, default: Date.now },
    isRecurring: { type: Boolean, default: false },
    recurringPeriod: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'] },
  },
  { timestamps: true }
);

expenseSchema.index({ category: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ branchId: 1, date: -1 });
expenseSchema.index({ userId: 1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
