import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  _id: mongoose.Types.ObjectId;
  loyalty_points_per_100_mru: number;
  loyalty_redeem_rate: number;
  taxRate: number;
  currency: string;
  company_name: string;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    loyalty_points_per_100_mru: { type: Number, default: 1, min: 0 },
    loyalty_redeem_rate: { type: Number, default: 1, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    currency: { type: String, default: 'MRU' },
    company_name: { type: String, default: 'RestoManager' },
  },
  { timestamps: true }
);

settingsSchema.statics.getSingleton = async function (): Promise<ISettings> {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

settingsSchema.statics.updateSettings = async function (data: Partial<ISettings>): Promise<ISettings> {
  const settings = await this.findOne();
  if (!settings) {
    return this.create(data);
  }
  Object.assign(settings, data);
  await settings.save();
  return settings;
};

export const Settings = mongoose.model<ISettings, any>('Settings', settingsSchema);
