import mongoose, { Document } from 'mongoose';
export interface ISettings extends Document {
    _id: mongoose.Types.ObjectId;
    loyalty_points_per_100_mru: number;
    loyalty_redeem_rate: number;
    taxRate: number;
    currency: string;
    company_name: string;
    whatsapp_business_phone_id?: string;
    whatsapp_token?: string;
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_pass?: string;
    fcm_server_key?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Settings: any;
//# sourceMappingURL=Settings.d.ts.map