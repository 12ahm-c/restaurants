import { Settings, ISettings } from '../../models/Settings';

export class SettingsService {
  static async getSettings(): Promise<ISettings> {
    return Settings.getSingleton();
  }

  static async updateSettings(data: Partial<ISettings>): Promise<ISettings> {
    return Settings.updateSettings(data);
  }

  static async getTaxRate(): Promise<number> {
    const settings = await this.getSettings();
    return settings.taxRate;
  }

  static async getLoyaltyRate(): Promise<number> {
    const settings = await this.getSettings();
    return settings.loyalty_points_per_100_mru;
  }
}
