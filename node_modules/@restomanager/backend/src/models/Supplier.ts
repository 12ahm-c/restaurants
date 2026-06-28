import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  balanceDue: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    balanceDue: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

supplierSchema.index({ name: 1 });
supplierSchema.index({ isActive: 1 });

export const Supplier = mongoose.model<ISupplier>('Supplier', supplierSchema);
