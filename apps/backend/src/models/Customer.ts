import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  preferences?: string;
  loyaltyPoints: number;
  debt: number;
  birthDate?: Date;
  branchId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: '' },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    preferences: { type: String, trim: true },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    debt: { type: Number, default: 0 },
    birthDate: { type: Date },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  },
  { timestamps: true }
);

customerSchema.index({ email: 1 });
customerSchema.index({ loyaltyPoints: -1 });
customerSchema.index({ firstName: 'text', lastName: 'text' });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
