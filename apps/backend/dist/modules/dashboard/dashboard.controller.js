"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("./dashboard.service");
const response_1 = require("../../utils/response");
class DashboardController {
    static async getEmployeeDashboard(req, res) {
        try {
            const dashboard = await dashboard_service_1.DashboardService.getEmployeeDashboard();
            (0, response_1.sendSuccess)(res, dashboard);
        }
        catch (error) {
            (0, response_1.sendSuccess)(res, {
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
    static async getManagerDashboard(req, res) {
        try {
            const { period } = req.query;
            const dashboard = await dashboard_service_1.DashboardService.getManagerDashboard(period);
            (0, response_1.sendSuccess)(res, dashboard);
        }
        catch (error) {
            (0, response_1.sendSuccess)(res, {
                revenue: { total: 0, change: 0 },
                orders: { total: 0, averageTicket: 0 },
                topProducts: [],
                tentUtilization: 0,
                alertsCount: 0,
            });
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=dashboard.controller.js.map