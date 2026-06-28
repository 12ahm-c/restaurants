import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  threshold: number;
  unitPrice: number;
  supplier?: string;
  supplierId?: mongoose.Types.ObjectId;
  expiryDate?: Date;
  branchId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    threshold: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    supplier: { type: String, trim: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    expiryDate: { type: Date },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

inventorySchema.index({ category: 1 });
inventorySchema.index({ branchId: 1 });
inventorySchema.index({ quantity: 1, threshold: 1 });
inventorySchema.index({ name: 'text' });
inventorySchema.index({ supplierId: 1 });

export const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);
