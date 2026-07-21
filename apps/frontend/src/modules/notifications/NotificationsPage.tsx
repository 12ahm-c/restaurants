import { useEffect } from 'react';
import { useNotificationStore } from '../../stores/notificationStore';
import { Bell, ShoppingCart, CheckCircle, DollarSign, AlertTriangle, Star, Info, Sun, BarChart3 } from 'lucide-react';

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  new_order: { icon: ShoppingCart, color: 'text-brand-400', bg: 'bg-brand-500/10' },
  order_ready: { icon: CheckCircle, color: 'text-brand-400', bg: 'bg-brand-500/10' },
  order_served: { icon: CheckCircle, color: 'text-brand-400', bg: 'bg-brand-500/10' },
  payment_received: { icon: DollarSign, color: 'text-brand-400', bg: 'bg-brand-500/10' },
  stock_critical: { icon: AlertTriangle, color: 'text-coral-400', bg: 'bg-coral-500/10' },
  loyalty_earned: { icon: Star, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  manager_morning: { icon: Sun, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  daily_summary: { icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  system: { icon: Info, color: 'text-surface-400', bg: 'bg-surface-800' },
};

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchNotifications(useNotificationStore.getState().page + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold dark:text-white text-surface-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-coral-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-brand-400 hover:text-brand-500 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 && !isLoading ? (
        <div className="card rounded-lg shadow p-12 text-center">
          <Bell size={48} className="mx-auto text-surface-400 mb-4" />
          <p className="text-surface-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type] || typeConfig.system;
            const Icon = config.icon;

            return (
              <div
                key={notification._id}
                onClick={() => !notification.isRead && markAsRead(notification._id)}
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  notification.isRead
                    ? 'card dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5'
                    : 'bg-brand-500/10 border-brand-500/20 hover:bg-brand-500/20'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${config.bg} flex-shrink-0`}>
                  <Icon size={20} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold ${notification.isRead ? 'dark:text-surface-300 text-surface-700' : 'dark:text-white text-surface-900'}`}>
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-surface-300 mt-0.5">{notification.message}</p>
                  <p className="text-xs text-surface-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={isLoading}
          className="w-full mt-4 py-2.5 text-sm font-medium text-brand-400 hover:text-brand-500 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}
