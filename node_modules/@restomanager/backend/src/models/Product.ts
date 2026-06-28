import mongoose, { Document, Schema } from 'mongoose';

export type ProductStatus = 'available' | 'unavailable' | 'discontinued';

export interface IRecipeItem {
  inventoryId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId: mongoose.Types.ObjectId;
  price: number;
  prepTime: number;
  status: ProductStatus;
  recipe: IRecipeItem[];
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, min: 0 },
    prepTime: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['available', 'unavailable', 'discontinued'],
      default: 'available',
    },
    recipe: [
      {
        inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
        quantity: { type: Number, required: true, min: 0 },
      },
    ],
  },
  { timestamps: true }
);

productSchema.index({ name: 'text' });
productSchema.index({ categoryId: 1 });
productSchema.index({ status: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
