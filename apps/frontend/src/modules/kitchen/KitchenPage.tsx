import { useEffect, useState } from 'react';
import { useKitchenStore } from '../../stores/kitchenStore';
import { useI18n } from '../../i18n/I18nContext';
import { useSocket } from '../../hooks/useSocket';
import { useUIStore } from '../../stores/uiStore';
import { Clock, CheckCircle, AlertCircle, Flame, RefreshCw, ChefHat, UtensilsCrossed } from 'lucide-react';

export function KitchenPage() {
  const [activeFilter, setActiveFilter] = useState<string>('');
  const {
    queue,
    isLoading,
    error,
    fetchQueue,
    startPreparation,
    markReady,
    pendingCount,
    preparingCount,
    readyCount,
  } = useKitchenStore();
  const { addToast } = useUIStore();
  const { socket, isConnected } = useSocket();
  const { t } = useI18n();

  const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string; gradient: string }> = {
    pending: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400', label: t('orders.pending'), gradient: 'from-blue-400 to-indigo-500' },
    preparing: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400', label: t('orders.preparing'), gradient: 'from-amber-400 to-orange-500' },
    ready: { bg: 'bg-brand-500/15', text: 'text-brand-400', dot: 'bg-brand-400', label: t('orders.ready'), gradient: 'from-brand-400 to-accent-500' },
  };

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    if (!socket) return;

    socket.on('order:new', (data) => {
      useKitchenStore.getState().updateFromSocket('order:new', data);
      addToast('info', t('orders.new'));
    });

    socket.on('order:status-update', (data) => {
      useKitchenStore.getState().updateFromSocket('order:status-update', data);
    });

    socket.on('order:cancelled', (data) => {
      useKitchenStore.getState().updateFromSocket('order:cancelled', data);
    });

    return () => {
      socket.off('order:new');
      socket.off('order:status-update');
      socket.off('order:cancelled');
    };
  }, [socket, addToast]);

  const handleStartPreparation = async (id: string) => {
    try {
      await startPreparation(id);
      addToast('success', t('orders.preparing'));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    }
  };

  const handleMarkReady = async (id: string) => {
    try {
      await markReady(id);
      addToast('success', t('orders.ready'));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    }
  };

  const filteredQueue = queue.filter((item) =>
    activeFilter ? item.status === activeFilter : true
  );

  const getElapsedTime = (startTime?: string) => {
    if (!startTime) return '0:00';
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  if (error) {
    return (
      <div className="p-6 bg-coral-500/10 border border-coral-500/20 rounded-2xl">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-coral-400" size={20} />
          <span className="text-coral-400">{error}</span>
        </div>
      </div>
    );
  }

  const filters = [
    { key: '', label: t('kitchen.title'), count: queue.length, color: 'bg-surface-700 text-surface-300 border-surface-600' },
    { key: 'pending', label: t('orders.pending'), count: pendingCount(), color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
    { key: 'preparing', label: t('orders.preparing'), count: preparingCount(), color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    { key: 'ready', label: t('orders.ready'), count: readyCount(), color: 'bg-brand-500/15 text-brand-400 border-brand-500/20' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{t('kitchen.title')}</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-brand-400' : 'bg-coral-400'}`} />
            <span className="text-sm text-surface-400">{isConnected ? t('common.active') : t('common.inactive')}</span>
          </div>
        </div>
        <button onClick={() => fetchQueue(activeFilter ? { status: activeFilter } : undefined)} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} />
          {t('common.next')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border
              ${activeFilter === f.key
                ? f.key === 'pending' ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                  : f.key === 'preparing' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                  : f.key === 'ready' ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20'
                  : 'bg-white/10 text-white border-white/20 shadow-lg'
                : f.color + ' hover:opacity-80'
              }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Queue */}
      {filteredQueue.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChefHat size={32} className="text-surface-600" />
          </div>
          <p className="text-surface-400 font-medium">{t('kitchen.noOrders')}</p>
          <p className="text-sm text-surface-500 mt-1">{t('orders.new')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQueue.map((item) => {
            const status = statusConfig[item.status] || statusConfig.pending;
            return (
              <div
                key={item._id}
                className={`card overflow-hidden transition-all duration-300 card-hover
                  ${item.priority === 1 ? 'ring-2 ring-coral-400/50 shadow-lg shadow-coral-500/10' : ''}`}
              >
                {/* Status gradient bar */}
                <div className={`h-1.5 bg-gradient-to-r ${status.gradient}`} />
                
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold text-white">
                        #{item.orderId.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-sm text-surface-400 flex items-center gap-1 mt-0.5">
                        <UtensilsCrossed size={12} />
                        {item.table?.tentNumber ? `خيمة #${item.table.tentNumber} - ${item.table.size === 'small' ? 'صغيرة' : item.table.size === 'large' ? 'كبيرة' : 'متوسطة'}` : t('orders.table')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.priority === 1 && (
                        <span className="badge bg-coral-500/15 text-coral-400 border border-coral-500/20">
                          <Flame size={10} className="mr-1" />
                          PRIORITY
                        </span>
                      )}
                      <span className={`badge ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-surface-400 mb-4">
                    <Clock size={14} className="mr-1.5" />
                    {getElapsedTime(item.startTime || item.createdAt)}
                  </div>

                  {item.items && item.items.length > 0 && (
                    <div className="mb-4 p-3 bg-surface-800/50 rounded-xl border border-white/5">
                      <p className="text-xs font-semibold text-surface-500 uppercase mb-2">{t('orders.items')}</p>
                      <div className="space-y-1.5">
                        {item.items.map((orderItem, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-surface-200 font-medium">
                              {orderItem.quantity}x {orderItem.productName}
                            </span>
                            {orderItem.notes && (
                              <span className="text-surface-500 italic text-xs">{orderItem.notes}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.order?.notes && (
                    <div className="text-sm text-surface-400 italic mb-4 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                      Note: {item.order.notes}
                    </div>
                  )}
                </div>

                <div className="px-5 pb-5">
                  {item.status === 'pending' && (
                    <button
                      onClick={() => handleStartPreparation(item._id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
                    >
                      <Flame size={18} />
                      {t('orders.preparing')}
                    </button>
                  )}
                  {item.status === 'preparing' && (
                    <button
                      onClick={() => handleMarkReady(item._id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:from-brand-600 hover:to-accent-600 transition-all shadow-lg shadow-brand-500/20"
                    >
                      <CheckCircle size={18} />
                      {t('orders.ready')}
                    </button>
                  )}
                  {item.status === 'ready' && (
                    <div className="text-center py-3 bg-brand-500/10 text-brand-400 font-semibold rounded-xl border border-brand-500/20">
                      {t('orders.ready')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
