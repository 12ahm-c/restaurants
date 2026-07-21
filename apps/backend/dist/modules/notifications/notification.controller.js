"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
const fcm_service_1 = require("../../services/fcm.service");
class NotificationController {
    static async getNotifications(req, res) {
        try {
            const userId = req.user.sub;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const unreadOnly = req.query.unreadOnly === 'true';
            const { notifications, total, unreadCount } = await notification_service_1.NotificationService.getNotifications(userId, page, limit, unreadOnly);
            res.json({
                success: true,
                data: notifications,
                meta: { page, limit, total, unreadCount },
            });
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to get notifications' });
        }
    }
    static async markAsRead(req, res) {
        try {
            const userId = req.user.sub;
            const { id } = req.params;
            const notification = await notification_service_1.NotificationService.markAsRead(userId, id);
            if (!notification) {
                res.status(404).json({ message: 'Notification not found' });
                return;
            }
            res.json({ success: true, data: notification });
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to mark notification as read' });
        }
    }
    static async markAllAsRead(req, res) {
        try {
            const userId = req.user.sub;
            const updatedCount = await notification_service_1.NotificationService.markAllAsRead(userId);
            res.json({ success: true, data: { updatedCount } });
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to mark all notifications as read' });
        }
    }
    static async registerFcmToken(req, res) {
        try {
            const userId = req.user.sub;
            const token = req.body?.token;
            if (!token || typeof token !== 'string') {
                res.status(400).json({ success: false, error: { message: 'FCM token is required' } });
                return;
            }
            await fcm_service_1.FcmService.registerToken(userId, token);
            res.json({ success: true, data: { registered: true } });
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to register FCM token' });
        }
    }
    static async unregisterFcmToken(req, res) {
        try {
            const userId = req.user.sub;
            const token = req.body?.token;
            if (!token || typeof token !== 'string') {
                res.status(400).json({ success: false, error: { message: 'FCM token is required' } });
                return;
            }
            await fcm_service_1.FcmService.unregisterToken(userId, token);
            res.json({ success: true, data: { unregistered: true } });
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to unregister FCM token' });
        }
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=notification.controller.js.map