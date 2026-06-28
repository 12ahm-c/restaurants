import { create } from 'zustand';
import { notificationService, Notification } from '../services/notification.service';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  page: number;

  fetchNotifications: (page?: number, unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,
  page: 1,

  fetchNotifications: async (page: number = 1, unreadOnly: boolean = false) => {
    set({ isLoading: true });
    try {
      const result = await notificationService.getNotifications(page, 20, unreadOnly);
      set({
        notifications: page === 1 ? result.notifications : [...get().notifications, ...result.notifications],
        unreadCount: result.unreadCount,
        hasMore: result.notifications.length === 20,
        page,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      const notifications = get().notifications.map((n) =>
        n._id === notificationId ? { ...n, isRead: true } : n
      );
      set({
        notifications,
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      const notifications = get().notifications.map((n) => ({ ...n, isRead: true }));
      set({ notifications, unreadCount: 0 });
    } catch (error: any) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set({
      notifications: [notification, ...get().notifications],
      unreadCount: get().unreadCount + 1,
    });
  },

  incrementUnreadCount: () => {
    set({ unreadCount: get().unreadCount + 1 });
  },

  resetUnreadCount: () => {
    set({ unreadCount: 0 });
  },
}));
