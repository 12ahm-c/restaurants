import React, { useEffect } from 'react';
import { useDashboardStore } from '../../stores/dashboardStore';
import { useSocket } from '../../hooks/useSocket';
import { PeriodSelector } from '../../components/dashboard/PeriodSelector';

export const ManagerDashboard: React.FC = () => {
  const { managerKPIs, fetchManagerKPIs, selectedPeriod, setPeriod, isLoading, error } = useDashboardStore();
  const { socket } = useSocket();

  useEffect(() => {
    fetchManagerKPIs(selectedPeriod);
    const interval = setInterval(() => fetchManagerKPIs(selectedPeriod), 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  useEffect(() => {
    if (socket) {
      socket.on('dashboard:update', () => {
        fetchManagerKPIs(selectedPeriod);
      });
    }
    return () => {
      if (socket) socket.off('dashboard:update');
    };
  }, [socket, selectedPeriod]);

  if (isLoading && !managerKPIs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-surface-700 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-sm text-surface-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-coral-500/10 border border-coral-500/20 rounded-2xl">
        <p className="text-coral-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold dark:text-white text-surface-900">Manager Dashboard</h1>
        <PeriodSelector selected={selectedPeriod} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="stat-card">
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-surface-400">Revenue</h3>
            <p className="text-3xl font-bold dark:text-white text-surface-900 mt-2">
              {(managerKPIs?.revenue.total || 0).toFixed(2)} MRU
            </p>
            {managerKPIs?.revenue.change !== undefined && (
              <p className={`text-sm mt-2 flex items-center gap-1 ${managerKPIs.revenue.change >= 0 ? 'text-brand-400' : 'text-coral-400'}`}>
                {managerKPIs.revenue.change >= 0 ? '↑' : '↓'} {managerKPIs.revenue.change.toFixed(1)}% vs previous
              </p>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-surface-400">Total Orders</h3>
            <p className="text-3xl font-bold dark:text-white text-surface-900 mt-2">{managerKPIs?.orders.total || 0}</p>
            <p className="text-sm text-surface-500 mt-2">
              Avg: {(managerKPIs?.orders.averageTicket || 0).toFixed(2)} MRU
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-surface-400">Table Utilization</h3>
            <p className="text-3xl font-bold dark:text-white text-surface-900 mt-2">
              {(managerKPIs?.tableUtilization || 0).toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-surface-400">Alerts</h3>
            <p className="text-3xl font-bold text-amber-400 mt-2">
              {managerKPIs?.alertsCount || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold dark:text-white text-surface-900 mb-4">Top Products</h2>
        {managerKPIs?.topProducts && managerKPIs.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="dark:border-b dark:border-white/5 border-b border-black/5">
                  <th className="text-left py-3 text-xs font-semibold text-surface-400 uppercase">Product</th>
                  <th className="text-right py-3 text-xs font-semibold text-surface-400 uppercase">Quantity Sold</th>
                  <th className="text-right py-3 text-xs font-semibold text-surface-400 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="dark:divide-y dark:divide-white/5 divide-y divide-black/5">
                {managerKPIs.topProducts.map((product: { name: string; quantity: number; revenue: number }, index: number) => (
                  <tr key={index} className="table-row">
                    <td className="py-3 text-sm dark:text-white text-surface-900">{product.name}</td>
                    <td className="text-right py-3 text-sm text-surface-300">{product.quantity}</td>
                    <td className="text-right py-3 text-sm font-semibold text-brand-400">{product.revenue.toFixed(2)} MRU</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-surface-500 text-sm">No product data available</p>
        )}
      </div>
    </div>
  );
};
