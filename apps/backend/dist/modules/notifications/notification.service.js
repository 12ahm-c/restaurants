"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const Notification_1 = require("../../models/Notification");
const User_1 = require("../../models/User");
const Order_1 = require("../../models/Order");
const Payment_1 = require("../../models/Payment");
const emitters_1 = require("../../socket/emitters");
const socket_server_1 = require("../../socket/socket.server");
const logger_1 = require("../../utils/logger");
class NotificationService {
    static async createNotification(userId, title, message, type, entity, entityId, metadata) {
        const notification = await Notification_1.Notification.create({
            userId,
            title,
            message,
            type,
            entity,
            entityId,
            metadata,
        });
        try {
            const io = (0, socket_server_1.getIO)();
            (0, emitters_1.emitNotificationNew)(io, {
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
        }
        catch (err) {
            logger_1.logger.warn({ err: err }, 'Failed to emit notification:new');
        }
        return notification;
    }
    static async getNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
        const query = { userId };
        if (unreadOnly) {
            query.isRead = false;
        }
        const skip = (page - 1) * limit;
        const [notifications, total, unreadCount] = await Promise.all([
            Notification_1.Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Notification_1.Notification.countDocuments({ userId }),
            Notification_1.Notification.countDocuments({ userId, isRead: false }),
        ]);
        return { notifications, total, unreadCount };
    }
    static async markAsRead(userId, notificationId) {
        return Notification_1.Notification.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true }, { new: true });
    }
    static async markAllAsRead(userId) {
        const result = await Notification_1.Notification.updateMany({ userId, isRead: false }, { isRead: true });
        return result.modifiedCount;
    }
    static async notifyChefsNewOrder(orderId, orderNumber, tableName, items) {
        const chefs = await User_1.User.find({ role: 'chef' });
        const itemList = items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
        for (const chef of chefs) {
            try {
                await this.createNotification(chef._id.toString(), 'New Order', `${orderNumber} — Table ${tableName}: ${itemList}`, 'new_order', 'order', orderId, { orderNumber, tableName, items });
            }
            catch (err) {
                logger_1.logger.warn({ err, chefId: chef._id }, 'Failed to notify chef');
            }
        }
    }
    static async notifyServersOrderReady(orderId, orderNumber, tableName) {
        const servers = await User_1.User.find({ role: 'server' });
        for (const server of servers) {
            try {
                await this.createNotification(server._id.toString(), 'Order Ready', `${orderNumber} — Table ${tableName} is ready to serve`, 'order_ready', 'order', orderId, { orderNumber, tableName });
            }
            catch (err) {
                logger_1.logger.warn({ err, serverId: server._id }, 'Failed to notify server');
            }
        }
    }
    static async notifyPaymentReceived(orderId, orderNumber, amount, method) {
        const users = await User_1.User.find({ role: { $in: ['manager', 'owner', 'cashier'] } });
        for (const user of users) {
            try {
                await this.createNotification(user._id.toString(), 'Payment Received', `${orderNumber} — ${amount} MRU via ${method}`, 'payment_received', 'order', orderId, { orderNumber, amount, method });
            }
            catch (err) {
                logger_1.logger.warn({ err, userId: user._id }, 'Failed to notify about payment');
            }
        }
    }
    static async notifyOrderServed(orderId, orderNumber, tableName) {
        const users = await User_1.User.find({ role: { $in: ['manager', 'owner'] } });
        for (const user of users) {
            try {
                await this.createNotification(user._id.toString(), 'Order Served', `${orderNumber} — Table ${tableName} has been served`, 'order_served', 'order', orderId, { orderNumber, tableName });
            }
            catch (err) {
                logger_1.logger.warn({ err, userId: user._id }, 'Failed to notify about served order');
            }
        }
    }
    static async createStockCriticalNotification(inventoryId, productName, quantity, threshold) {
        const users = await User_1.User.find({ role: { $in: ['manager', 'owner', 'stock_manager'] } });
        for (const user of users) {
            try {
                await this.createNotification(user._id.toString(), 'Stock Critical', `${productName} is critically low (${quantity}/${threshold})`, 'stock_critical', 'inventory', inventoryId, { productName, quantity, threshold });
            }
            catch (err) {
                logger_1.logger.warn({ err, userId: user._id }, 'Failed to notify about stock');
            }
        }
    }
    static async notifyManagersMorningReminder() {
        const users = await User_1.User.find({ role: { $in: ['manager', 'owner'] }, isActive: true });
        for (const user of users) {
            try {
                await this.createNotification(user._id.toString(), 'صباح الخير', 'افتح التطبيق وراجع الطلبات، الخيام، والمبيعات لبدء يوم عمل منظم.', 'manager_morning', 'dashboard', undefined, { target: '/dashboard/manager' });
            }
            catch (err) {
                logger_1.logger.warn({ err, userId: user._id }, 'Failed to send manager morning reminder');
            }
        }
    }
    static async notifyManagersDailySummary(referenceDate = new Date()) {
        const startOfDay = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate(), 23, 59, 59, 999));
        const [ordersCount, completedOrdersCount, cancelledOrdersCount, revenueResult] = await Promise.all([
            Order_1.Order.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
            Order_1.Order.countDocuments({
                status: { $in: ['served', 'completed'] },
                createdAt: { $gte: startOfDay, $lte: endOfDay },
            }),
            Order_1.Order.countDocuments({ status: 'cancelled', createdAt: { $gte: startOfDay, $lte: endOfDay } }),
            Payment_1.Payment.aggregate([
                { $match: { status: 'completed', createdAt: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: null, revenue: { $sum: '$amount' } } },
            ]),
        ]);
        const revenue = revenueResult[0]?.revenue || 0;
        const users = await User_1.User.find({ role: { $in: ['manager', 'owner'] }, isActive: true });
        const message = `تقرير اليوم: ${ordersCount} طلب، ${completedOrdersCount} مكتمل، ${cancelledOrdersCount} ملغي، والإيرادات ${revenue} MRU.`;
        for (const user of users) {
            try {
                await this.createNotification(user._id.toString(), 'تقرير اليوم', message, 'daily_summary', 'dashboard', undefined, {
                    target: '/dashboard/manager',
                    ordersCount,
                    completedOrdersCount,
                    cancelledOrdersCount,
                    revenue,
                    date: startOfDay.toISOString().slice(0, 10),
                });
            }
            catch (err) {
                logger_1.logger.warn({ err, userId: user._id }, 'Failed to send manager daily summary');
            }
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map