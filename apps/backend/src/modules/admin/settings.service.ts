import { Settings, ISettings } from '../../models/Settings';

export class SettingsService {
  static async getSettings(): Promise<ISettings> {
    return Settings.getSingleton();
  }

  static async updateSettings(data: Partial<ISettings>): Promise<ISettings> {
    return Settings.updateSettings(data);
  }

  static async getLoyaltyRate(): Promise<number> {
    const settings = await this.getSettings();
    return settings.loyalty_points_per_100_mru;
  }

  static async getTentPrice(tentSize: 'small' | 'medium' | 'large', duration: string): Promise<number> {
    const settings = await this.getSettings();
    const pricing = settings.tent_pricing;

    const durationMap: Record<string, keyof typeof pricing> = {
      '1h': 'per_hour',
      '2h': 'per_2hours',
      '3h': 'per_3hours',
      '4h': 'per_4hours',
      '5h': 'per_5hours',
      '6h': 'per_6hours',
      '8h': 'per_8hours',
      '12h': 'per_12hours',
    };

    const period = durationMap[duration] || 'per_hour';
    return pricing[period]?.[tentSize] || 0;
  }
}
