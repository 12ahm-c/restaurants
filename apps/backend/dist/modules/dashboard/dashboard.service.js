"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const Order_1 = require("../../models/Order");
const Tent_1 = require("../../models/Tent");
const Inventory_1 = require("../../models/Inventory");
const Payment_1 = require("../../models/Payment");
const Customer_1 = require("../../models/Customer");
const redis_1 = require("../../config/redis");
class DashboardService {
    static async getEmployeeDashboard() {
        const cacheKey = 'dashboard:employee';
        if ((0, redis_1.isRedisAvailable)()) {
            const cached = await redis_1.redis.get(cacheKey);
            if (cached)
                return JSON.parse(cached);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [salesResult, totalOrders, totalCustomers, occupiedTents, newOrders, preparingOrders, readyOrders, deliveryOrders, costResult, topProducts, stockAlerts,] = await Promise.all([
            Payment_1.Payment.aggregate([
                { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Order_1.Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
            Customer_1.Customer.countDocuments({}),
            Tent_1.Tent.countDocuments({ status: 'occupied' }),
            Order_1.Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, status: 'new' }),
            Order_1.Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, status: 'preparing' }),
            Order_1.Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, status: 'ready' }),
            Order_1.Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, type: 'delivery', status: { $in: ['ready', 'preparing'] } }),
            Order_1.Order.aggregate([
                { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: { $in: ['paid', 'served'] } } },
                { $group: { _id: null, totalCost: { $sum: '$totalHT' }, totalRevenue: { $sum: '$totalTTC' } } },
            ]),
            Order_1.Order.aggregate([
                { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
                { $unwind: '$items' },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'items.productId',
                        foreignField: '_id',
                        as: 'product',
                    },
                },
                { $unwind: '$product' },
                {
                    $group: {
                        _id: '$product.name',
                        quantity: { $sum: '$items.quantity' },
                        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    },
                },
                { $sort: { quantity: -1 } },
                { $limit: 5 },
            ]),
            Inventory_1.Inventory.find({ $expr: { $lte: ['$quantity', '$threshold'] } })
                .select('name quantity threshold unit')
                .lean(),
        ]);
        const todaySales = salesResult.length > 0 ? salesResult[0].total : 0;
        const todayCost = costResult.length > 0 ? costResult[0].totalCost : 0;
        const todayProfit = todaySales - todayCost;
        const result = {
            todaySales,
            totalOrders,
            totalCustomers,
            occupiedTents,
            newOrders,
            preparingOrders,
            readyOrders,
            deliveryOrders,
            todayProfit,
            topProducts: topProducts.map((p) => ({ name: p._id, quantity: p.quantity, revenue: p.revenue })),
            stockAlerts: stockAlerts.map((a) => ({ name: a.name, quantity: a.quantity, threshold: a.threshold, unit: a.unit })),
        };
        if ((0, redis_1.isRedisAvailable)()) {
            await redis_1.redis.setex(cacheKey, 60, JSON.stringify(result));
        }
        return result;
    }
    static async getManagerDashboard(period = 'day') {
        const cacheKey = `dashboard:manager:${period}`;
        if ((0, redis_1.isRedisAvailable)()) {
            const cached = await redis_1.redis.get(cacheKey);
            if (cached)
                return JSON.parse(cached);
        }
        const { startDate, endDate, prevStartDate, prevEndDate } = this.getDateRanges(period);
        const [revenueResult, prevRevenueResult, ordersCount, topProducts, activeTents, totalTents, criticalAlerts] = await Promise.all([
            Payment_1.Payment.aggregate([
                { $match: { createdAt: { $gte: startDate, $lt: endDate }, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Payment_1.Payment.aggregate([
                { $match: { createdAt: { $gte: prevStartDate, $lt: prevEndDate }, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Order_1.Order.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
            Order_1.Order.aggregate([
                { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
                { $unwind: '$items' },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'items.productId',
                        foreignField: '_id',
                        as: 'product',
                    },
                },
                { $unwind: '$product' },
                {
                    $group: {
                        _id: '$product.name',
                        quantity: { $sum: '$items.quantity' },
                        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    },
                },
                { $sort: { quantity: -1 } },
                { $limit: 10 },
            ]),
            Tent_1.Tent.countDocuments({ status: { $in: ['occupied', 'reserved'] } }),
            Tent_1.Tent.countDocuments({}),
            Inventory_1.Inventory.countDocuments({ $expr: { $lte: ['$quantity', '$threshold'] } }),
        ]);
        const currentRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
        const prevRevenue = prevRevenueResult.length > 0 ? prevRevenueResult[0].total : 0;
        const change = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const averageTicket = ordersCount > 0 ? currentRevenue / ordersCount : 0;
        const tentUtilization = totalTents > 0 ? (activeTents / totalTents) * 100 : 0;
        const result = {
            revenue: { total: currentRevenue, change },
            orders: { total: ordersCount, averageTicket },
            topProducts: topProducts.map((p) => ({ name: p._id, quantity: p.quantity, revenue: p.revenue })),
            tentUtilization,
            alertsCount: criticalAlerts,
        };
        if ((0, redis_1.isRedisAvailable)()) {
            await redis_1.redis.setex(cacheKey, 300, JSON.stringify(result));
        }
        return result;
    }
    static getDateRanges(period) {
        const now = new Date();
        let startDate;
        let prevStartDate;
        let prevEndDate;
        switch (period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                prevStartDate = new Date(startDate);
                prevStartDate.setDate(startDate.getDate() - 7);
                prevEndDate = new Date(startDate);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                prevStartDate = new Date(startDate);
                prevStartDate.setMonth(startDate.getMonth() - 1);
                prevEndDate = new Date(startDate);
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                prevStartDate = new Date(startDate);
                prevStartDate.setFullYear(startDate.getFullYear() - 1);
                prevEndDate = new Date(startDate);
                break;
            default:
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                prevStartDate = new Date(startDate);
                prevStartDate.setDate(startDate.getDate() - 1);
                prevEndDate = new Date(startDate);
        }
        return {
            startDate,
            endDate: now,
            prevStartDate,
            prevEndDate,
        };
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=dashboard.service.js.map