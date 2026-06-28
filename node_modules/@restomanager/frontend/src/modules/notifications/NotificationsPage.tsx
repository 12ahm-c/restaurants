import { useEffect } from 'react';
import { useNotificationStore } from '../../stores/notificationStore';
import { Bell, ShoppingCart, CheckCircle, DollarSign, AlertTriangle, Star, Info } from 'lucide-react';

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  new_order: { icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
  order_ready: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  order_served: { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
  payment_received: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  stock_critical: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  loyalty_earned: { icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  system: { icon: Info, color: 'text-gray-600', bg: 'bg-gray-100' },
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
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 && !isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No notifications yet</p>
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
                    ? 'bg-white border-gray-200 hover:bg-gray-50'
                    : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${config.bg} flex-shrink-0`}>
                  <Icon size={20} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
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
          className="w-full mt-4 py-2.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}
