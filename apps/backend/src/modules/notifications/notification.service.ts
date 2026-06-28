import { Notification, INotification, NotificationType } from '../../models/Notification';
import { User } from '../../models/User';
import { emitNotificationNew } from '../../socket/emitters';
import { getIO } from '../../socket/socket.server';
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
      });
    } catch (err) {
      logger.warn({ err: err as Error }, 'Failed to emit notification:new');
    }

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
          'New Order',
          `${orderNumber} — Table ${tableName}: ${itemList}`,
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
          'Order Ready',
          `${orderNumber} — Table ${tableName} is ready to serve`,
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
          'Payment Received',
          `${orderNumber} — ${amount} MRU via ${method}`,
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
          'Order Served',
          `${orderNumber} — Table ${tableName} has been served`,
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
          'Stock Critical',
          `${productName} is critically low (${quantity}/${threshold})`,
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
}
