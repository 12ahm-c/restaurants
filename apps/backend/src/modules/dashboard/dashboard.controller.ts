import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/response';

export class DashboardController {
  static async getEmployeeDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboard = await DashboardService.getEmployeeDashboard();
      sendSuccess(res, dashboard);
    } catch (error: any) {
      sendSuccess(res, {
        todaySales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        occupiedTents: 0,
        newOrders: 0,
        preparingOrders: 0,
        readyOrders: 0,
        deliveryOrders: 0,
        todayProfit: 0,
        topProducts: [],
        stockAlerts: [],
      });
    }
  }

  static async getManagerDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { period } = req.query;
      const dashboard = await DashboardService.getManagerDashboard(period as string);
      sendSuccess(res, dashboard);
    } catch (error: any) {
      sendSuccess(res, {
        revenue: { total: 0, change: 0 },
        orders: { total: 0, averageTicket: 0 },
        topProducts: [],
        tentUtilization: 0,
        alertsCount: 0,
      });
    }
  }
}
