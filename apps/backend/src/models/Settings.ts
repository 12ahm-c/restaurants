import mongoose, { Document, Schema } from 'mongoose';

export interface ITentPricing {
  small: number;
  medium: number;
  large: number;
}

export interface ISettings extends Document {
  _id: mongoose.Types.ObjectId;
  loyalty_points_per_100_mru: number;
  currency: string;
  company_name: string;
  logo: string;
  tent_pricing: {
    per_hour: ITentPricing;
    per_2hours: ITentPricing;
    per_3hours: ITentPricing;
    per_4hours: ITentPricing;
    per_5hours: ITentPricing;
    per_6hours: ITentPricing;
    per_8hours: ITentPricing;
    per_12hours: ITentPricing;
  };
  createdAt: Date;
  updatedAt: Date;
}

const tentPricingSchema = new Schema<ITentPricing>(
  {
    small: { type: Number, default: 0, min: 0 },
    medium: { type: Number, default: 0, min: 0 },
    large: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const settingsSchema = new Schema<ISettings>(
  {
    loyalty_points_per_100_mru: { type: Number, default: 1, min: 0 },
    currency: { type: String, default: 'MRU' },
    company_name: { type: String, default: 'RestoManager' },
    logo: { type: String, default: '' },
    tent_pricing: {
      type: {
        per_hour: { type: tentPricingSchema, default: () => ({}) },
        per_2hours: { type: tentPricingSchema, default: () => ({}) },
        per_3hours: { type: tentPricingSchema, default: () => ({}) },
        per_4hours: { type: tentPricingSchema, default: () => ({}) },
        per_5hours: { type: tentPricingSchema, default: () => ({}) },
        per_6hours: { type: tentPricingSchema, default: () => ({}) },
        per_8hours: { type: tentPricingSchema, default: () => ({}) },
        per_12hours: { type: tentPricingSchema, default: () => ({}) },
      },
      default: () => ({}),
    },
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
