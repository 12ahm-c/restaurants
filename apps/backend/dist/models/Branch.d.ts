import mongoose, { Document } from 'mongoose';
export interface IBranch extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    address?: string;
    phone?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Branch: mongoose.Model<IBranch, {}, {}, {}, mongoose.Document<unknown, {}, IBranch, {}, {}> & IBranch & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Branch.d.ts.map