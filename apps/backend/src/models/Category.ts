import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  branchId?: mongoose.Types.ObjectId;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ branchId: 1 });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
