import mongoose, { Document } from 'mongoose';
export interface ICustomer extends Document {
    _id: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
    preferences?: string;
    loyaltyPoints: number;
    birthDate?: Date;
    branchId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Customer: mongoose.Model<ICustomer, {}, {}, {}, mongoose.Document<unknown, {}, ICustomer, {}, {}> & ICustomer & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Customer.d.ts.map