import { useEffect, useState, useCallback } from 'react';
import { orderService } from '../../services/order.service';
import { useI18n } from '../../i18n/I18nContext';
import { OrderDTO } from '../../types';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useTentStore } from '../../stores/tentStore';
import { useSocket } from '../../hooks/useSocket';
import { Clock, CheckCircle, Trash2, RefreshCw, Package, ClipboardList } from 'lucide-react';

export function ActiveOrdersPage() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const { markTentEmpty } = useTentStore();
  const { socket } = useSocket();
  const { t } = useI18n();

  const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    new: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400', label: t('orders.new') },
    preparing: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400', label: t('orders.preparing') },
    ready: { bg: 'bg-brand-500/15', text: 'text-brand-400', dot: 'bg-brand-400', label: t('orders.ready') },
    served: { bg: 'bg-surface-500/15', text: 'text-surface-400', dot: 'bg-surface-400', label: t('orders.served') },
    cancelled: { bg: 'bg-coral-500/15', text: 'text-coral-400', dot: 'bg-coral-400', label: t('orders.cancelled') },
    completed: { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-400', label: t('orders.paid') },
  };

  const isAdmin = user?.role === 'owner' || user?.role === 'manager' || user?.role === 'cashier';
  const isServer = user?.role === 'server';

  const loadOrders = useCallback(async () => {
    try {
      if (isAdmin) {
        const result = await orderService.getOrders({ limit: 50 });
        const active = result.orders.filter((o) => o.status !== 'cancelled' && o.status !== 'completed');
        setOrders(active);
      } else if (isServer) {
        const [readyResult, servedResult] = await Promise.all([
          orderService.getOrders({ status: 'ready', limit: 50 }),
          orderService.getOrders({ status: 'served', limit: 50 }),
        ]);
        setOrders([...readyResult.orders, ...servedResult.orders]);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, isServer]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!socket) return;

    socket.on('order:new', () => loadOrders());
    socket.on('order:status-update', () => loadOrders());
    socket.on('order:cancelled', () => loadOrders());

    return () => {
      socket.off('order:new');
      socket.off('order:status-update');
      socket.off('order:cancelled');
    };
  }, [socket, loadOrders]);

  const handleMarkAsServed = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'served');
      addToast('success', t('orders.served'));
      loadOrders();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      addToast('error', message);
    }
  };

  const handleClearTent = async (tentId: string, orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'completed');
      await markTentEmpty(tentId);
      addToast('success', t('tents.available'));
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      addToast('error', message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-surface-700 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-sm text-surface-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Server view - Card-based
  if (isServer) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">{t('orders.ready')}</h1>
            <p className="text-sm text-surface-400 mt-1">{orders.length} {t('orders.pending').toLowerCase()}</p>
          </div>
          <button onClick={loadOrders} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={16} />
            {t('common.next')}
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-surface-600" />
            </div>
            <p className="text-surface-400 font-medium">{t('kitchen.noOrders')}</p>
            <p className="text-sm text-surface-500 mt-1">{t('orders.new')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.new;
              return (
                <div key={order._id} className="card overflow-hidden card-hover animate-slide-up">
                  {/* Status bar */}
                  <div className={`h-1 ${status.dot}`} />
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-lg font-bold text-white">
                          #{order._id.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-sm text-surface-400">
                           {t('orders.tent')}: {(() => { const t = order.tentId as unknown as { tentNumber?: number; size?: string }; if (!t?.tentNumber) return 'N/A'; const sizeLabel = t.size === 'small' ? 'صغيرة' : t.size === 'large' ? 'كبيرة' : 'متوسطة'; return `خيمة #${t.tentNumber} - ${sizeLabel}`; })()}
                         </p>
                      </div>
                      <span className={`badge ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`} />
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-surface-400 mb-4">
                      <Clock size={14} className="mr-1.5" />
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </div>

                    <div className="text-xl font-bold text-brand-400 mb-4">
                      {order.totalTTC} MRU
                    </div>

                    <div className="space-y-2">
                      {order.status === 'ready' && (
                        <button
                          onClick={() => handleMarkAsServed(order._id)}
                          className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={18} />
                          {t('orders.served')}
                        </button>
                      )}
                      {order.status === 'served' && (order.tentId as unknown as { _id: string })?._id && (
                         <button
                           onClick={() => handleClearTent((order.tentId as unknown as { _id: string })._id, order._id)}
                           className="btn-danger w-full flex items-center justify-center gap-2"
                         >
                           <Trash2 size={18} />
                           {t('tents.available')}
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Admin/Manager view - Card-based for mobile, table for desktop
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{t('orders.active')}</h1>
          <p className="text-sm text-surface-400 mt-1">{orders.length} {t('orders.active').toLowerCase()}</p>
        </div>
        <button onClick={loadOrders} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} />
          {t('common.next')}
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={32} className="text-surface-600" />
          </div>
          <p className="text-surface-400 font-medium">{t('orders.noOrders')}</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card view */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.new;
              return (
                <div key={order._id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        #{order._id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-xs text-surface-500 capitalize">{order.type}</span>
                    </div>
                    <span className={`badge text-[10px] ${status.bg} ${status.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1`} />
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-surface-400">
                      <span>{t('orders.tent')}: {(() => { const t = order.tentId as unknown as { tentNumber?: number; size?: string }; if (!t?.tentNumber) return 'N/A'; const sizeLabel = t.size === 'small' ? 'صغيرة' : t.size === 'large' ? 'كبيرة' : 'متوسطة'; return `خيمة #${t.tentNumber} - ${sizeLabel}`; })()}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-brand-400">{order.totalTTC} MRU</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table view */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">{t('orders.active')}</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">{t('orders.tent')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">{t('common.status')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">{t('common.amount')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">{t('common.time')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.new;
                  return (
                    <tr key={order._id} className="table-row">
                      <td className="px-6 py-4">
                        <span className="font-bold text-sm text-white">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-surface-300">
                         {(() => { const t = order.tentId as unknown as { tentNumber?: number; size?: string }; if (!t?.tentNumber) return 'N/A'; const sizeLabel = t.size === 'small' ? 'صغيرة' : t.size === 'large' ? 'كبيرة' : 'متوسطة'; return `خيمة #${t.tentNumber} - ${sizeLabel}`; })()}
                       </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${status.bg} ${status.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-brand-400">{order.totalTTC} MRU</td>
                      <td className="px-6 py-4 text-sm text-surface-400">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
