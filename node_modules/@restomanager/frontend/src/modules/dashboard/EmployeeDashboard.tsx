import React, { useEffect, useState } from 'react';
import { useDashboardStore } from '../../stores/dashboardStore';
import { useAuthStore } from '../../stores/authStore';
import { useSocket } from '../../hooks/useSocket';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Table2,
  Flame,
  ChefHat,
  CheckCircle,
  Truck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Activity,
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { employeeKPIs, fetchEmployeeKPIs, isLoading, error } = useDashboardStore();
  const { user } = useAuthStore();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { socket } = useSocket();

  useEffect(() => {
    fetchEmployeeKPIs();
    const interval = setInterval(fetchEmployeeKPIs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('dashboard:update', () => {
        fetchEmployeeKPIs();
        setLastUpdated(new Date());
      });
    }
    return () => {
      if (socket) socket.off('dashboard:update');
    };
  }, [socket]);

  if (isLoading && !employeeKPIs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-2xl">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!employeeKPIs) return null;

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} MRU`;
  const isCashier = user?.role === 'cashier';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            {isCashier ? "Today's Summary" : 'Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            <Clock size={14} className="inline mr-1" />
            Updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-soft" />
          <span className="text-sm text-emerald-600 font-medium">Live</span>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales */}
        <div className="stat-card bg-gradient-to-br from-brand-500 to-orange-600 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <DollarSign size={22} />
              </div>
              <span className="flex items-center gap-1 text-sm font-medium bg-white/20 px-2 py-1 rounded-lg">
                <ArrowUpRight size={14} />
                Today
              </span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(employeeKPIs.todaySales)}</p>
            <p className="text-white/70 text-sm">Total Sales</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        </div>

        {/* Orders */}
        <div className="stat-card bg-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <ShoppingCart size={22} className="text-blue-600" />
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                <Activity size={14} />
                Live
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{employeeKPIs.totalOrders}</p>
            <p className="text-gray-500 text-sm">Total Orders</p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -translate-y-12 translate-x-12" />
        </div>

        {/* Customers */}
        {!isCashier && (
          <>
            <div className="stat-card bg-white">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Users size={22} className="text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{employeeKPIs.totalCustomers}</p>
                <p className="text-gray-500 text-sm">Customers</p>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -translate-y-12 translate-x-12" />
            </div>

            {/* Tables */}
            <div className="stat-card bg-white">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <Table2 size={22} className="text-amber-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{employeeKPIs.occupiedTables}</p>
                <p className="text-gray-500 text-sm">Occupied Tables</p>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -translate-y-12 translate-x-12" />
            </div>
          </>
        )}
      </div>

      {/* Order Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 hover:shadow-card-hover transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl text-white shadow-md">
              <Flame size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{employeeKPIs.newOrders}</p>
              <p className="text-xs text-gray-500 font-medium">New Orders</p>
            </div>
          </div>
        </div>

        <div className="card p-4 hover:shadow-card-hover transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl text-white shadow-md">
              <ChefHat size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{employeeKPIs.preparingOrders}</p>
              <p className="text-xs text-gray-500 font-medium">Preparing</p>
            </div>
          </div>
        </div>

        <div className="card p-4 hover:shadow-card-hover transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl text-white shadow-md">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{employeeKPIs.readyOrders}</p>
              <p className="text-xs text-gray-500 font-medium">Ready</p>
            </div>
          </div>
        </div>

        <div className="card p-4 hover:shadow-card-hover transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl text-white shadow-md">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{employeeKPIs.deliveryOrders}</p>
              <p className="text-xs text-gray-500 font-medium">Delivery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom sections */}
      {!isCashier && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Profit */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${employeeKPIs.todayProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {employeeKPIs.todayProfit >= 0 
                  ? <TrendingUp size={20} className="text-emerald-600" />
                  : <TrendingDown size={20} className="text-red-600" />
                }
              </div>
              <h3 className="font-semibold text-gray-900">Daily Profit</h3>
            </div>
            <p className={`text-3xl font-bold ${employeeKPIs.todayProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(employeeKPIs.todayProfit)}
            </p>
          </div>

          {/* Top Products */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Top Selling Items</h3>
            {employeeKPIs.topProducts.length === 0 ? (
              <p className="text-sm text-gray-500">No sales today</p>
            ) : (
              <div className="space-y-3">
                {employeeKPIs.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold
                      ${index === 0 ? 'bg-brand-100 text-brand-600' 
                        : index === 1 ? 'bg-gray-100 text-gray-600' 
                        : 'bg-gray-50 text-gray-500'}`}>
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-900 flex-1 truncate">{product.name}</span>
                    <span className="text-sm font-semibold text-brand-600">{product.quantity}x</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stock Alerts */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Stock Alerts</h3>
            </div>
            {employeeKPIs.stockAlerts.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-sm text-gray-500">All stock levels OK</p>
              </div>
            ) : (
              <div className="space-y-3">
                {employeeKPIs.stockAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <span className="text-sm text-gray-900 truncate">{alert.name}</span>
                    <span className="text-sm font-semibold text-red-600">
                      {alert.quantity}/{alert.threshold}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
