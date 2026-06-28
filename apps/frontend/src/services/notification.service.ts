import { apiClient } from './api-client';

export type NotificationType =
  | 'new_order'
  | 'order_ready'
  | 'order_served'
  | 'payment_received'
  | 'stock_critical'
  | 'loyalty_earned'
  | 'system';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export const notificationService = {
  async getNotifications(page: number = 1, limit: number = 20, unreadOnly: boolean = false): Promise<NotificationsResponse> {
    const response = await apiClient.get('/notifications/me', {
      params: { page, limit, unreadOnly },
    });
    return {
      notifications: response.data.data,
      total: response.data.meta.total,
      unreadCount: response.data.meta.unreadCount,
    };
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data.data;
  },

  async markAllAsRead(): Promise<number> {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data.data.updatedCount;
  },
};
