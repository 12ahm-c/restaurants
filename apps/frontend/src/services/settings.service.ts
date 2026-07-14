import { apiClient } from './api-client';

export interface Settings {
  _id: string;
  loyalty_points_per_100_mru: number;
  loyalty_redeem_rate: number;
  taxRate: number;
  currency: string;
  company_name: string;
  logo: string;
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
