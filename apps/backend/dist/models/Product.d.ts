import mongoose, { Document } from 'mongoose';
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
export declare const Product: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct, {}, {}> & IProduct & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Product.d.ts.map