import { useEffect, useState } from 'react';
import { useKitchenStore } from '../../stores/kitchenStore';
import { useSocket } from '../../hooks/useSocket';
import { useUIStore } from '../../stores/uiStore';
import { Clock, CheckCircle, AlertCircle, Flame, RefreshCw, ChefHat, UtensilsCrossed } from 'lucide-react';

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string; gradient: string }> = {
  pending: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Pending', gradient: 'from-blue-400 to-indigo-500' },
  preparing: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Preparing', gradient: 'from-amber-400 to-orange-500' },
  ready: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Ready', gradient: 'from-emerald-400 to-green-500' },
};

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

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    if (!socket) return;

    socket.on('order:new', (data) => {
      useKitchenStore.getState().updateFromSocket('order:new', data);
      addToast('info', 'New order received');
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
      addToast('success', 'Preparation started');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to start preparation');
    }
  };

  const handleMarkReady = async (id: string) => {
    try {
      await markReady(id);
      addToast('success', 'Order marked as ready');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to mark as ready');
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
          <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading kitchen queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-2xl">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <span className="text-red-600">{error}</span>
        </div>
      </div>
    );
  }

  const filters = [
    { key: '', label: 'All', count: queue.length, color: 'bg-gray-100 text-gray-700' },
    { key: 'pending', label: 'Pending', count: pendingCount(), color: 'bg-blue-100 text-blue-700' },
    { key: 'preparing', label: 'Preparing', count: preparingCount(), color: 'bg-amber-100 text-amber-700' },
    { key: 'ready', label: 'Ready', count: readyCount(), color: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Kitchen Queue</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        <button onClick={() => fetchQueue(activeFilter ? { status: activeFilter } : undefined)} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
              ${activeFilter === f.key
                ? f.key === 'pending' ? 'bg-blue-500 text-white shadow-md'
                  : f.key === 'preparing' ? 'bg-amber-500 text-white shadow-md'
                  : f.key === 'ready' ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gray-900 text-white shadow-md'
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
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChefHat size={32} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No orders in queue</p>
          <p className="text-sm text-gray-400 mt-1">New orders will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQueue.map((item) => {
            const status = statusConfig[item.status] || statusConfig.pending;
            return (
              <div
                key={item._id}
                className={`card overflow-hidden transition-all duration-200 hover:shadow-card-hover
                  ${item.priority === 1 ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}
              >
                {/* Status gradient bar */}
                <div className={`h-1.5 bg-gradient-to-r ${status.gradient}`} />
                
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        #{item.orderId.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <UtensilsCrossed size={12} />
                        {item.table?.name || 'No table'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.priority === 1 && (
                        <span className="badge bg-red-100 text-red-700">
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

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Clock size={14} className="mr-1.5" />
                    {getElapsedTime(item.startTime || item.createdAt)}
                  </div>

                  {item.items && item.items.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Items</p>
                      <div className="space-y-1.5">
                        {item.items.map((orderItem, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-700 font-medium">
                              {orderItem.quantity}x {orderItem.productName}
                            </span>
                            {orderItem.notes && (
                              <span className="text-gray-400 italic text-xs">{orderItem.notes}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.order?.notes && (
                    <div className="text-sm text-gray-500 italic mb-4 p-3 bg-amber-50 rounded-xl">
                      Note: {item.order.notes}
                    </div>
                  )}
                </div>

                <div className="px-5 pb-5">
                  {item.status === 'pending' && (
                    <button
                      onClick={() => handleStartPreparation(item._id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
                    >
                      <Flame size={18} />
                      Start Preparation
                    </button>
                  )}
                  {item.status === 'preparing' && (
                    <button
                      onClick={() => handleMarkReady(item._id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all shadow-md"
                    >
                      <CheckCircle size={18} />
                      Mark Ready
                    </button>
                  )}
                  {item.status === 'ready' && (
                    <div className="text-center py-3 bg-emerald-50 text-emerald-700 font-semibold rounded-xl">
                      Ready for pickup
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
