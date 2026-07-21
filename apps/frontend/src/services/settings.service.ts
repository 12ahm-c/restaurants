import { apiClient } from './api-client';

export interface Settings {
  _id: string;
  loyalty_points_per_100_mru: number;
  currency: string;
  company_name: string;
  logo: string;
  tent_price_per_hour: {
    small: number;
    medium: number;
    large: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const settingsService = {
  async getSettings(): Promise<Settings> {
    const response = await apiClient.get('/admin/settings');
    return response.data.data;
  },

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    const response = await apiClient.put('/admin/settings', data);
    return response.data.data;
  },
};
