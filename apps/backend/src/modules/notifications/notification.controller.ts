import { Request, Response } from 'express';
import { NotificationService } from './notification.service';

export class NotificationController {
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.sub;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const { notifications, total, unreadCount } = await NotificationService.getNotifications(
        userId,
        page,
        limit,
        unreadOnly
      );

      res.json({
        success: true,
        data: notifications,
        meta: { page, limit, total, unreadCount },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get notifications' });
    }
  }

  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.sub;
      const { id } = req.params;

      const notification = await NotificationService.markAsRead(userId, id);
      if (!notification) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }

      res.json({ success: true, data: notification });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to mark notification as read' });
    }
  }

  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.sub;
      const updatedCount = await NotificationService.markAllAsRead(userId);

      res.json({ success: true, data: { updatedCount } });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to mark all notifications as read' });
    }
  }
}
