import { Order } from '../../models/Order';
import { Table } from '../../models/Table';
import { Inventory } from '../../models/Inventory';
import { Payment } from '../../models/Payment';
import { Customer } from '../../models/Customer';
import { redis, isRedisAvailable } from '../../config/redis';

export class DashboardService {
  static async getEmployeeDashboard(): Promise<{
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
  }> {
    const cacheKey = 'dashboard:employee';
    
    if (isRedisAvailable()) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      salesResult,
      totalOrders,
      totalCustomers,
      occupiedTables,
      newOrders,
      preparingOrders,
      readyOrders,
      deliveryOrders,
      costResult,
      topProducts,
      stockAlerts,
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Customer.countDocuments({}),
      Table.countDocuments({ status: 'occupied' }),
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, status: 'new' }),
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, status: 'preparing' }),
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, status: 'ready' }),
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, type: 'delivery', status: { $in: ['ready', 'preparing'] } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: { $in: ['paid', 'served'] } } },
        { $group: { _id: null, totalCost: { $sum: '$totalHT' }, totalRevenue: { $sum: '$totalTTC' } } },
      ]),
      Order.aggregate([
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
      Inventory.find({ $expr: { $lte: ['$quantity', '$threshold'] } })
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
      occupiedTables,
      newOrders,
      preparingOrders,
      readyOrders,
      deliveryOrders,
      todayProfit,
      topProducts: topProducts.map((p) => ({ name: p._id, quantity: p.quantity, revenue: p.revenue })),
      stockAlerts: stockAlerts.map((a) => ({ name: a.name, quantity: a.quantity, threshold: a.threshold, unit: a.unit })),
    };

    if (isRedisAvailable()) {
      await redis.setex(cacheKey, 60, JSON.stringify(result));
    }
    return result;
  }

  static async getManagerDashboard(period: string = 'day'): Promise<{
    revenue: { total: number; change: number };
    orders: { total: number; averageTicket: number };
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
    tableUtilization: number;
    alertsCount: number;
  }> {
    const cacheKey = `dashboard:manager:${period}`;
    
    if (isRedisAvailable()) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const { startDate, endDate, prevStartDate, prevEndDate } = this.getDateRanges(period);

    const [revenueResult, prevRevenueResult, ordersCount, topProducts, activeTables, totalTables, criticalAlerts] =
      await Promise.all([
        Payment.aggregate([
          { $match: { createdAt: { $gte: startDate, $lt: endDate }, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Payment.aggregate([
          { $match: { createdAt: { $gte: prevStartDate, $lt: prevEndDate }, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Order.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
        Order.aggregate([
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
        Table.countDocuments({ status: { $in: ['occupied', 'reserved'] } }),
        Table.countDocuments({}),
        Inventory.countDocuments({ $expr: { $lte: ['$quantity', '$threshold'] } }),
      ]);

    const currentRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const prevRevenue = prevRevenueResult.length > 0 ? prevRevenueResult[0].total : 0;
    const change = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const averageTicket = ordersCount > 0 ? currentRevenue / ordersCount : 0;
    const tableUtilization = totalTables > 0 ? (activeTables / totalTables) * 100 : 0;

    const result = {
      revenue: { total: currentRevenue, change },
      orders: { total: ordersCount, averageTicket },
      topProducts: topProducts.map((p) => ({ name: p._id, quantity: p.quantity, revenue: p.revenue })),
      tableUtilization,
      alertsCount: criticalAlerts,
    };

    if (isRedisAvailable()) {
      await redis.setex(cacheKey, 300, JSON.stringify(result));
    }
    return result;
  }

  private static getDateRanges(period: string) {
    const now = new Date();
    let startDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;

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
