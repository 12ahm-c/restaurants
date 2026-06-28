import mongoose, { Document, Schema } from 'mongoose';

export interface IBranch extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

branchSchema.index({ name: 1 });
branchSchema.index({ isActive: 1 });

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);
