import { useEffect, useState, useCallback } from 'react';
import { orderService } from '../../services/order.service';
import { OrderDTO } from '../../types';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useTableStore } from '../../stores/tableStore';
import { useSocket } from '../../hooks/useSocket';
import { Clock, CheckCircle, Trash2, RefreshCw, Package } from 'lucide-react';

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  new: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'New' },
  preparing: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Preparing' },
  ready: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Ready' },
  served: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Served' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Cancelled' },
  completed: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Completed' },
};

export function ActiveOrdersPage() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const { clearTable } = useTableStore();
  const { socket } = useSocket();

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
      addToast('success', 'Order marked as served');
      loadOrders();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      addToast('error', message);
    }
  };

  const handleClearTable = async (tableId: string, orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'completed');
      await clearTable(tableId);
      addToast('success', 'Table cleared successfully');
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear table';
      addToast('error', message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading orders...</p>
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
            <h1 className="text-2xl font-display font-bold text-gray-900">Ready for Delivery</h1>
            <p className="text-sm text-gray-500 mt-1">{orders.length} orders pending</p>
          </div>
          <button onClick={loadOrders} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="card bg-white p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No orders ready for delivery</p>
            <p className="text-sm text-gray-400 mt-1">New orders will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.new;
              return (
                <div key={order._id} className="card bg-white overflow-hidden hover:shadow-card-hover transition-all animate-slide-up">
                  {/* Status bar */}
                  <div className={`h-1 ${status.dot}`} />
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          #{order._id.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Table: {(order.tableId as unknown as { name: string })?.name || 'N/A'}
                        </p>
                      </div>
                      <span className={`badge ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`} />
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock size={14} className="mr-1.5" />
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </div>

                    <div className="text-xl font-bold text-brand-600 mb-4">
                      {order.totalTTC} MRU
                    </div>

                    <div className="space-y-2">
                      {order.status === 'ready' && (
                        <button
                          onClick={() => handleMarkAsServed(order._id)}
                          className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={18} />
                          Mark as Served
                        </button>
                      )}
                      {order.status === 'served' && (order.tableId as unknown as { _id: string })?._id && (
                        <button
                          onClick={() => handleClearTable((order.tableId as unknown as { _id: string })._id, order._id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                        >
                          <Trash2 size={18} />
                          Table Empty - Clear
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
          <h1 className="text-2xl font-display font-bold text-gray-900">All Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} active orders</p>
        </div>
        <button onClick={loadOrders} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="card bg-white p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No active orders</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card view */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.new;
              return (
                <div key={order._id} className="card bg-white p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900">
                        #{order._id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{order.type}</span>
                    </div>
                    <span className={`badge ${status.bg} ${status.text} text-[10px]`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1`} />
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>T: {(order.tableId as unknown as { name: string })?.name || 'N/A'}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-brand-600">{order.totalTTC} MRU</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table view */}
          <div className="hidden md:block card bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.new;
                  return (
                    <tr key={order._id} className="table-row">
                      <td className="px-6 py-4">
                        <span className="font-bold text-sm text-gray-900">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {(order.tableId as unknown as { name: string })?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{order.type}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{order.totalTTC} MRU</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${status.bg} ${status.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
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
