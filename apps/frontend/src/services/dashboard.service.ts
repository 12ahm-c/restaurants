import { apiClient } from './api-client';

export interface EmployeeDashboard {
  todaySales: number;
  totalOrders: number;
  totalCustomers: number;
  occupiedTables: number;
  newOrders: number;
  preparingOrders: number;
  readyOrders: number;
  deliveryOrders: number;
  todayProfit: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  stockAlerts: Array<{ name: string; quantity: number; threshold: number; unit: string }>;
}

export interface ManagerDashboard {
  revenue: { total: number; change: number };
  orders: { total: number; averageTicket: number };
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  tableUtilization: number;
  alertsCount: number;
}

export const dashboardService = {
  async getEmployeeDashboard(): Promise<EmployeeDashboard> {
    const response = await apiClient.get('/dashboard/employee');
    return response.data.data;
  },

  async getManagerDashboard(period: string = 'day'): Promise<ManagerDashboard> {
    const response = await apiClient.get('/dashboard/manager', { params: { period } });
    return response.data.data;
  },
};
