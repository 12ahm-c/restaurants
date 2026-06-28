import mongoose, { Document, Schema, Model } from 'mongoose';

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

const logSchema = new Schema<ILog, ILogModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

logSchema.index({ userId: 1, timestamp: -1 });
logSchema.index({ action: 1, timestamp: -1 });
logSchema.index({ entity: 1, entityId: 1 });

logSchema.pre('save', function (next) {
  const log = this as ILog;
  if (!log.isNew) {
    const error = new Error('Logs are immutable and cannot be updated');
    return next(error);
  }
  next();
});

logSchema.statics.createLog = async function (data: {
  userId: mongoose.Types.ObjectId;
  action: string;
  entity: string;
  entityId?: mongoose.Types.ObjectId;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<ILog> {
  return this.create({
    ...data,
    timestamp: new Date(),
  });
};

export const Log = mongoose.model<ILog, ILogModel>('Log', logSchema);
