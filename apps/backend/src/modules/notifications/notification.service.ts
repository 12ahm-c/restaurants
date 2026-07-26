import { Notification, INotification, NotificationType } from '../../models/Notification';
import { User } from '../../models/User';
import { Order } from '../../models/Order';
import { Payment } from '../../models/Payment';
import { emitNotificationNew } from '../../socket/emitters';
import { getIO } from '../../socket/socket.server';
import { FcmService } from '../../services/fcm.service';
import { logger } from '../../utils/logger';

export class NotificationService {
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    entity?: string,
    entityId?: string,
    metadata?: Record<string, unknown>
  ): Promise<INotification> {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      entity,
      entityId,
      metadata,
    });

    try {
      const io = getIO();
      emitNotificationNew(io, {
        userId,
        notificationId: notification._id.toString(),
        title,
        message,
        type,
        createdAt: notification.createdAt,
        entity,
        entityId,
        metadata,
      });
    } catch (err) {
      logger.warn({ err: err as Error }, 'Failed to emit notification:new');
    }

    FcmService.sendToUser(userId, title, message, {
      notificationId: notification._id.toString(),
      type,
      entity,
      entityId,
      ...(metadata || {}),
    }).catch((err) => {
      logger.warn({ err, userId }, 'Failed to send FCM notification');
    });

    return notification;
  }

  static async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    const query: any = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return { notifications, total, unreadCount };
  }

  static async markAsRead(userId: string, notificationId: string): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  }

  static async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    return result.modifiedCount;
  }

  static async notifyChefsNewOrder(
    orderId: string,
    orderNumber: string,
    tableName: string,
    items: Array<{ name: string; quantity: number }>
  ): Promise<void> {
    const chefs = await User.find({ role: 'chef' });
    const itemList = items.map((i) => `${i.quantity}x ${i.name}`).join(', ');

    for (const chef of chefs) {
      try {
        await this.createNotification(
          chef._id.toString(),
          'طلب جديد 🆕',
          `${orderNumber} — خيمة ${tableName}: ${itemList}`,
          'new_order',
          'order',
          orderId,
          { orderNumber, tableName, items }
        );
      } catch (err) {
        logger.warn({ err, chefId: chef._id }, 'Failed to notify chef');
      }
    }
  }

  static async notifyServersOrderReady(
    orderId: string,
    orderNumber: string,
    tableName: string
  ): Promise<void> {
    const servers = await User.find({ role: 'server' });

    for (const server of servers) {
      try {
        await this.createNotification(
          server._id.toString(),
          'الطلب جاهز ✅',
          `${orderNumber} — خيمة ${tableName} جاهز للتقديم`,
          'order_ready',
          'order',
          orderId,
          { orderNumber, tableName }
        );
      } catch (err) {
        logger.warn({ err, serverId: server._id }, 'Failed to notify server');
      }
    }
  }

  static async notifyPaymentReceived(
    orderId: string,
    orderNumber: string,
    amount: number,
    method: string
  ): Promise<void> {
    const users = await User.find({ role: { $in: ['manager', 'owner', 'cashier'] } });

    for (const user of users) {
      try {
        await this.createNotification(
          user._id.toString(),
          'تم استلام الدفع 💰',
          `${orderNumber} — ${amount} MRU عبر ${method}`,
          'payment_received',
          'order',
          orderId,
          { orderNumber, amount, method }
        );
      } catch (err) {
        logger.warn({ err, userId: user._id }, 'Failed to notify about payment');
      }
    }
  }

  static async notifyOrderServed(
    orderId: string,
    orderNumber: string,
    tableName: string
  ): Promise<void> {
    const users = await User.find({ role: { $in: ['manager', 'owner'] } });

    for (const user of users) {
      try {
        await this.createNotification(
          user._id.toString(),
          'تم تقديم الطلب 🍽️',
          `${orderNumber} — خيمة ${tableName} تم تقديمها`,
          'order_served',
          'order',
          orderId,
          { orderNumber, tableName }
        );
      } catch (err) {
        logger.warn({ err, userId: user._id }, 'Failed to notify about served order');
      }
    }
  }

  static async createStockCriticalNotification(
    inventoryId: string,
    productName: string,
    quantity: number,
    threshold: number
  ): Promise<void> {
    const users = await User.find({ role: { $in: ['manager', 'owner', 'stock_manager'] } });

    for (const user of users) {
      try {
        await this.createNotification(
          user._id.toString(),
          'تنبيه مخزون ⚠️',
          `${productName} منخفض جداً (${quantity}/${threshold})`,
          'stock_critical',
          'inventory',
          inventoryId,
          { productName, quantity, threshold }
        );
      } catch (err) {
        logger.warn({ err, userId: user._id }, 'Failed to notify about stock');
      }
    }
  }

  static async notifyManagersMorningReminder(): Promise<void> {
    const users = await User.find({ role: { $in: ['manager', 'owner'] }, isActive: true });

    for (const user of users) {
      try {
        await this.createNotification(
          user._id.toString(),
          'صباح الخير',
          'افتح التطبيق وراجع الطلبات، الخيام، والمبيعات لبدء يوم عمل منظم.',
          'manager_morning',
          'dashboard',
          undefined,
          { target: '/dashboard/manager' }
        );
      } catch (err) {
        logger.warn({ err, userId: user._id }, 'Failed to send manager morning reminder');
      }
    }
  }

  static async notifyManagersDailySummary(referenceDate: Date = new Date()): Promise<void> {
    const startOfDay = new Date(Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
      0,
      0,
      0,
      0
    ));
    const endOfDay = new Date(Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
      23,
      59,
      59,
      999
    ));

    const [ordersCount, completedOrdersCount, cancelledOrdersCount, revenueResult] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      Order.countDocuments({
        status: { $in: ['served', 'completed'] },
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      Order.countDocuments({ status: 'cancelled', createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      Payment.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, revenue: { $sum: '$amount' } } },
      ]),
    ]);

    const revenue = revenueResult[0]?.revenue || 0;
    const users = await User.find({ role: { $in: ['manager', 'owner'] }, isActive: true });
    const message = `تقرير اليوم: ${ordersCount} طلب، ${completedOrdersCount} مكتمل، ${cancelledOrdersCount} ملغي، والإيرادات ${revenue} MRU.`;

    for (const user of users) {
      try {
        await this.createNotification(
          user._id.toString(),
          'تقرير اليوم',
          message,
          'daily_summary',
          'dashboard',
          undefined,
          {
            target: '/dashboard/manager',
            ordersCount,
            completedOrdersCount,
            cancelledOrdersCount,
            revenue,
            date: startOfDay.toISOString().slice(0, 10),
          }
        );
      } catch (err) {
        logger.warn({ err, userId: user._id }, 'Failed to send manager daily summary');
      }
    }
  }
}
