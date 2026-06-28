"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const Notification_1 = require("../../models/Notification");
const emitters_1 = require("../../socket/emitters");
const server_1 = require("../../server");
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
            (0, emitters_1.emitNotificationNew)(server_1.io, {
                userId,
                notificationId: notification._id.toString(),
                title,
                message,
                type,
                createdAt: notification.createdAt,
            });
        }
        catch (err) {
            console.error('Failed to emit notification:new', err);
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
    static async createOrderReadyNotification(orderId, tableNumber, userId) {
        await this.createNotification(userId, 'Order Ready', `Order for table ${tableNumber} is ready to serve`, 'order_ready', 'order', orderId, { tableNumber });
    }
    static async createStockCriticalNotification(inventoryId, productName, quantity, threshold) {
        const { User } = await Promise.resolve().then(() => __importStar(require('../../models/User')));
        const managers = await User.find({ role: { $in: ['manager', 'owner', 'stock_manager'] } });
        for (const manager of managers) {
            await this.createNotification(manager._id.toString(), 'Stock Critical', `${productName} is critically low (${quantity}/${threshold})`, 'stock_critical', 'inventory', inventoryId, { productName, quantity, threshold });
        }
    }
    static async createLoyaltyEarnedNotification(customerId, customerName, points, orderId) {
        const { Customer } = await Promise.resolve().then(() => __importStar(require('../../models/Customer')));
        const { User } = await Promise.resolve().then(() => __importStar(require('../../models/User')));
        const customer = await Customer.findById(customerId);
        if (!customer)
            return;
        const users = await User.find({});
        for (const user of users) {
            await this.createNotification(user._id.toString(), 'Loyalty Points Earned', `${customerName} earned ${points} loyalty points`, 'loyalty_earned', 'customer', customerId, { customerName, points, orderId });
        }
    }
    static async createPaymentReceivedNotification(orderId, amount, method, userId) {
        await this.createNotification(userId, 'Payment Received', `Payment of ${amount} MRU received via ${method}`, 'payment_received', 'order', orderId, { amount, method });
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map