export declare class DashboardService {
    static getEmployeeDashboard(): Promise<{
        todaySales: number;
        totalOrders: number;
        totalCustomers: number;
        occupiedTables: number;
        newOrders: number;
        preparingOrders: number;
        readyOrders: number;
        deliveryOrders: number;
        todayProfit: number;
        topProducts: Array<{
            name: string;
            quantity: number;
            revenue: number;
        }>;
        stockAlerts: Array<{
            name: string;
            quantity: number;
            threshold: number;
            unit: string;
        }>;
    }>;
    static getManagerDashboard(period?: string): Promise<{
        revenue: {
            total: number;
            change: number;
        };
        orders: {
            total: number;
            averageTicket: number;
        };
        topProducts: Array<{
            name: string;
            quantity: number;
            revenue: number;
        }>;
        tableUtilization: number;
        alertsCount: number;
    }>;
    private static getDateRanges;
}
//# sourceMappingURL=dashboard.service.d.ts.map