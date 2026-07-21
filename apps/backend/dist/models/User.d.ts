import mongoose, { Document } from 'mongoose';
export type UserRole = 'owner' | 'manager' | 'cashier' | 'server' | 'chef' | 'stock_manager';
export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    phone: string;
    passwordHash: string;
    role: UserRole;
    isActive: boolean;
    branchId?: mongoose.Types.ObjectId;
    language: string;
    fcmTokens: string[];
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map