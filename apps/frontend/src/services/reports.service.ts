import { apiClient } from './api-client';

export interface SalesReport {
  period: { from: string; to: string };
  sales: Array<{
    date: string;
    totalSales: number;
    ordersCount: number;
    averageTicket: number;
    cashSales: number;
    cardSales: number;
    mobileSales: number;
  }>;
  summary: {
    totalSales: number;
    totalOrders: number;
    averageTicket: number;
  };
}

export interface ProfitabilityReport {
  period: { from: string; to: string };
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

export interface StockUsageReport {
  period: { from: string; to: string };
  items: Array<{
    name: string;
    consumed: number;
    replenished: number;
    waste: number;
    movements: Array<{ type: string; quantity: number }>;
  }>;
}

export const reportsService = {
  async getSalesReport(from: string, to: string): Promise<SalesReport> {
    const response = await apiClient.get('/reports/sales', { params: { from, to } });
    return response.data.data;
  },

  async getProfitabilityReport(from: string, to: string): Promise<ProfitabilityReport> {
    const response = await apiClient.get('/reports/profitability', { params: { from, to } });
    return response.data.data;
  },

  async getStockUsageReport(from: string, to: string): Promise<StockUsageReport> {
    const response = await apiClient.get('/reports/stock-usage', { params: { from, to } });
    return response.data.data;
  },

  async downloadReport(format: 'pdf' | 'xlsx', reportType: string, from: string, to: string, restaurantName?: string): Promise<Blob> {
    const response = await apiClient.get(`/reports/${reportType}`, {
      params: { from, to, format, restaurantName },
      responseType: 'blob',
    });
    return response.data;
  },
};
