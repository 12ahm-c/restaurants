import mongoose, { Document, Model } from 'mongoose';
export interface ILog extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    action: string;
    entity: string;
    entityId?: mongoose.Types.ObjectId;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}
export interface ILogModel extends Model<ILog> {
    createLog(data: {
        userId: mongoose.Types.ObjectId;
        action: string;
        entity: string;
        entityId?: mongoose.Types.ObjectId;
        details?: Record<string, unknown>;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<ILog>;
}
export declare const Log: ILogModel;
//# sourceMappingURL=Log.d.ts.map