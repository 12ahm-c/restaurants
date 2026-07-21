import mongoose, { Document, Schema } from 'mongoose';

export type ProductStatus = 'available' | 'unavailable' | 'discontinued';

export interface IRecipeItem {
  inventoryId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IQuantityType {
  name: string;
  label: string;
  price: number;
  unit: string;
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
  isActive: boolean;
  recipe: IRecipeItem[];
  hasQuantityTypes: boolean;
  quantityTypes: IQuantityType[];
  emoji?: string;
  createdAt: Date;
  updatedAt: Date;
}

const quantityTypeSchema = new Schema<IQuantityType>(
  {
    name: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
  },
  { _id: false }
);

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
    isActive: { type: Boolean, default: true },
    recipe: [
      {
        inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
        quantity: { type: Number, required: true, min: 0 },
      },
    ],
    hasQuantityTypes: { type: Boolean, default: false },
    quantityTypes: [quantityTypeSchema],
    emoji: { type: String },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text' });
productSchema.index({ categoryId: 1 });
productSchema.index({ status: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
