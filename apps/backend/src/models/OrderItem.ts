import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderOption {
  name: string;
  price: number;
}

export interface IOrderItem extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  variant?: string;
  quantity: number;
  unitPrice: number;
  options: IOrderOption[];
  notes?: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    options: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    notes: { type: String, trim: true },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

orderItemSchema.index({ orderId: 1 });

export const OrderItem = mongoose.model<IOrderItem>('OrderItem', orderItemSchema);
