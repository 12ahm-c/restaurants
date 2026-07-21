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
    const hourlyPrice = settings.tent_price_per_hour?.[tentSize] || 0;

    // Extract number of hours from duration string (e.g., "2h" -> 2, "12h" -> 12)
    const hours = parseInt(duration.replace('h', ''), 10) || 1;

    return hourlyPrice * hours;
  }
}
