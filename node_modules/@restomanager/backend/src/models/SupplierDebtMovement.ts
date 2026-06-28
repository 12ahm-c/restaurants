import mongoose, { Document, Schema } from 'mongoose';

export type SupplierDebtMovementType = 'purchase_debt' | 'payment' | 'adjustment';

export interface ISupplierDebtMovement extends Document {
  _id: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  type: SupplierDebtMovementType;
  amount: number;
  previousBalance: number;
  newBalance: number;
  inventoryId?: mongoose.Types.ObjectId;
  stockMovementId?: mongoose.Types.ObjectId;
  description: string;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const supplierDebtMovementSchema = new Schema<ISupplierDebtMovement>(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    type: {
      type: String,
      enum: ['purchase_debt', 'payment', 'adjustment'],
      required: true,
    },
    amount: { type: Number, required: true },
    previousBalance: { type: Number, required: true },
    newBalance: { type: Number, required: true },
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory' },
    stockMovementId: { type: Schema.Types.ObjectId, ref: 'StockMovement' },
    description: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

supplierDebtMovementSchema.index({ supplierId: 1, createdAt: -1 });
supplierDebtMovementSchema.index({ type: 1 });

export const SupplierDebtMovement = mongoose.model<ISupplierDebtMovement>(
  'SupplierDebtMovement',
  supplierDebtMovementSchema
);
