import React, { useEffect } from 'react';
import { useDashboardStore } from '../../stores/dashboardStore';
import { useSocket } from '../../hooks/useSocket';

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

  const periods = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  if (isLoading && !managerKPIs) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manager Dashboard</h1>
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded ${
                selectedPeriod === p.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Revenue</h3>
          <p className="text-3xl font-bold mt-2">
            {(managerKPIs?.revenue.total || 0).toFixed(2)} MRU
          </p>
          {managerKPIs?.revenue.change !== undefined && (
            <p className={`text-sm mt-1 ${managerKPIs.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {managerKPIs.revenue.change >= 0 ? '+' : ''}{managerKPIs.revenue.change.toFixed(1)}% vs previous
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
          <p className="text-3xl font-bold mt-2">{managerKPIs?.orders.total || 0}</p>
          <p className="text-sm text-gray-500 mt-1">
            Avg: {(managerKPIs?.orders.averageTicket || 0).toFixed(2)} MRU
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Table Utilization</h3>
          <p className="text-3xl font-bold mt-2">
            {(managerKPIs?.tableUtilization || 0).toFixed(0)}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Alerts</h3>
          <p className="text-3xl font-bold mt-2 text-orange-600">
            {managerKPIs?.alertsCount || 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Top Products</h2>
        {managerKPIs?.topProducts && managerKPIs.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2">Quantity Sold</th>
                  <th className="text-right py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {managerKPIs.topProducts.map((product: { name: string; quantity: number; revenue: number }, index: number) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-2">{product.name}</td>
                    <td className="text-right py-2">{product.quantity}</td>
                    <td className="text-right py-2">{product.revenue.toFixed(2)} MRU</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No product data available</p>
        )}
      </div>
    </div>
  );
};
