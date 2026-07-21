import { apiClient } from './api-client';

export interface TentPricing {
  small: number;
  medium: number;
  large: number;
}

export interface Settings {
  _id: string;
  loyalty_points_per_100_mru: number;
  currency: string;
  company_name: string;
  logo: string;
  tent_pricing: {
    per_hour: TentPricing;
    per_2hours: TentPricing;
    per_3hours: TentPricing;
    per_4hours: TentPricing;
    per_5hours: TentPricing;
    per_6hours: TentPricing;
    per_8hours: TentPricing;
    per_12hours: TentPricing;
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
