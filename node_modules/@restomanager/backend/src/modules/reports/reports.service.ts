import { Payment } from '../../models/Payment';
import { Order } from '../../models/Order';
import { Inventory } from '../../models/Inventory';
import { StockMovement } from '../../models/StockMovement';
import { redis, isRedisAvailable } from '../../config/redis';

export class ReportsService {
  static async getSalesReport(from: string, to: string): Promise<any> {
    const startDate = new Date(from);
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    const cacheKey = `report:sales:${from}:${to}`;
    
    if (isRedisAvailable()) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const salesData = await Payment.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$amount' },
          ordersCount: { $sum: 1 },
          cashSales: {
            $sum: { $cond: [{ $eq: ['$method', 'cash'] }, '$amount', 0] },
          },
          cardSales: {
            $sum: { $cond: [{ $eq: ['$method', 'card'] }, '$amount', 0] },
          },
          mobileSales: {
            $sum: { $cond: [{ $eq: ['$method', 'mobile'] }, '$amount', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalSales = salesData.reduce((sum, day) => sum + day.totalSales, 0);
    const totalOrders = salesData.reduce((sum, day) => sum + day.ordersCount, 0);

    const result = {
      period: { from, to },
      sales: salesData.map((day) => ({
        date: day._id,
        totalSales: day.totalSales,
        ordersCount: day.ordersCount,
        averageTicket: day.ordersCount > 0 ? day.totalSales / day.ordersCount : 0,
        cashSales: day.cashSales,
        cardSales: day.cardSales,
        mobileSales: day.mobileSales,
      })),
      summary: {
        totalSales,
        totalOrders,
        averageTicket: totalOrders > 0 ? totalSales / totalOrders : 0,
      },
    };

    if (isRedisAvailable()) {
      await redis.setex(cacheKey, 300, JSON.stringify(result));
    }
    return result;
  }

  static async getProfitabilityReport(from: string, to: string): Promise<any> {
    const startDate = new Date(from);
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    const cacheKey = `report:profitability:${from}:${to}`;
    
    if (isRedisAvailable()) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const [revenueResult, expensesResult] = await Promise.all([
      Payment.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      StockMovement.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, type: 'replenishment' } },
        {
          $lookup: {
            from: 'inventories',
            localField: 'inventoryId',
            foreignField: '_id',
            as: 'inventory',
          },
        },
        { $unwind: '$inventory' },
        {
          $group: {
            _id: null,
            total: {
              $sum: { $multiply: ['$quantity', '$inventory.unitPrice'] },
            },
          },
        },
      ]),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const totalExpenses = expensesResult.length > 0 ? expensesResult[0].total : 0;
    const profit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    const result = {
      period: { from, to },
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit,
      margin,
    };

    if (isRedisAvailable()) {
      await redis.setex(cacheKey, 300, JSON.stringify(result));
    }
    return result;
  }

  static async getStockUsageReport(from: string, to: string): Promise<any> {
    const startDate = new Date(from);
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    const cacheKey = `report:stock:${from}:${to}`;
    
    if (isRedisAvailable()) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const stockUsage = await StockMovement.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $lookup: {
          from: 'inventories',
          localField: 'inventoryId',
          foreignField: '_id',
          as: 'inventory',
        },
      },
      { $unwind: '$inventory' },
      {
        $group: {
          _id: {
            inventoryId: '$inventoryId',
            name: '$inventory.name',
            type: '$type',
          },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      {
        $group: {
          _id: '$_id.inventoryId',
          name: { $first: '$_id.name' },
          movements: {
            $push: {
              type: '$_id.type',
              quantity: '$totalQuantity',
            },
          },
          totalConsumed: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'deduction'] }, '$totalQuantity', 0],
            },
          },
          totalReplenished: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'replenishment'] }, '$totalQuantity', 0],
            },
          },
          totalWaste: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'waste'] }, '$totalQuantity', 0],
            },
          },
        },
      },
      { $sort: { totalConsumed: -1 } },
    ]);

    const result = {
      period: { from, to },
      items: stockUsage.map((item) => ({
        name: item.name,
        consumed: item.totalConsumed,
        replenished: item.totalReplenished,
        waste: item.totalWaste,
        movements: item.movements,
      })),
    };

    if (isRedisAvailable()) {
      await redis.setex(cacheKey, 300, JSON.stringify(result));
    }
    return result;
  }
}
