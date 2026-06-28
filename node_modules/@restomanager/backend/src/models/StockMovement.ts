import mongoose, { Document, Schema } from 'mongoose';

export type MovementType = 'adjustment' | 'replenishment' | 'deduction' | 'waste';

export interface IStockMovement extends Document {
  _id: mongoose.Types.ObjectId;
  inventoryId: mongoose.Types.ObjectId;
  type: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  supplierId?: mongoose.Types.ObjectId;
  unitPrice?: number;
  paidSupplierPrice?: number;
  supplierAmountDue?: number;
  supplierDebtMovementId?: mongoose.Types.ObjectId;
  timestamp: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
    type: {
      type: String,
      enum: ['adjustment', 'replenishment', 'deduction', 'waste'],
      required: true,
    },
    quantity: { type: Number, required: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    reason: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    unitPrice: { type: Number, min: 0 },
    paidSupplierPrice: { type: Number, min: 0 },
    supplierAmountDue: { type: Number, min: 0 },
    supplierDebtMovementId: { type: Schema.Types.ObjectId, ref: 'SupplierDebtMovement' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

stockMovementSchema.index({ inventoryId: 1 });
stockMovementSchema.index({ timestamp: -1 });
stockMovementSchema.index({ type: 1 });
stockMovementSchema.index({ supplierId: 1 });

export const StockMovement = mongoose.model<IStockMovement>(
  'StockMovement',
  stockMovementSchema
);
