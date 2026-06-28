"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
class NotificationController {
    static async getNotifications(req, res) {
        try {
            const userId = req.user._id;
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
            const userId = req.user._id;
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
            const userId = req.user._id;
            const updatedCount = await notification_service_1.NotificationService.markAllAsRead(userId);
            res.json({ success: true, data: { updatedCount } });
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to mark all notifications as read' });
        }
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=notification.controller.js.map