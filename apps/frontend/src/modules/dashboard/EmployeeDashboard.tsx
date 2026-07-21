import React, { useEffect, useState } from 'react';
import { useDashboardStore } from '../../stores/dashboardStore';
import { useAuthStore } from '../../stores/authStore';
import { useI18n } from '../../i18n/I18nContext';
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
  Zap,
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { employeeKPIs, fetchEmployeeKPIs, isLoading, error } = useDashboardStore();
  const { user } = useAuthStore();
  const { t } = useI18n();
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
          <div className="w-10 h-10 border-3 border-surface-700 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-sm text-surface-400">{t('common.loading')}</p>
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

  if (!employeeKPIs) return null;

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} MRU`;
  const isCashier = user?.role === 'cashier';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold dark:text-white text-surface-900">
            {isCashier ? t('dashboard.title') : t('dashboard.title')}
          </h1>
          <p className="text-sm text-surface-400 mt-1 flex items-center gap-2">
            <Clock size={14} />
            {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 rounded-full border border-brand-500/20">
          <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse-soft" />
          <span className="text-sm text-brand-400 font-medium">{t('common.active')}</span>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue - Featured Card */}
        <div className="stat-card bg-gradient-to-br from-brand-500/20 to-accent-500/20 border-brand-500/20 sm:col-span-2 lg:col-span-1">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-brand-500/20 rounded-xl">
                <DollarSign size={22} className="text-brand-400" />
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-brand-400 bg-brand-500/10 px-2 py-1 rounded-lg">
                <ArrowUpRight size={12} />
                +12.5%
              </span>
            </div>
            <p className="text-3xl font-bold dark:text-white text-surface-900 mb-1">{formatCurrency(employeeKPIs.todaySales)}</p>
            <p className="text-surface-400 text-sm">{t('dashboard.revenue')}</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full -translate-y-16 translate-x-16" />
        </div>

        {/* Orders */}
        <div className="stat-card">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-blue-500/15 rounded-xl">
                <ShoppingCart size={22} className="text-blue-400" />
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">
                <Activity size={12} />
                {t('common.active')}
              </span>
            </div>
            <p className="text-3xl font-bold dark:text-white text-surface-900 mb-1">{employeeKPIs.totalOrders}</p>
            <p className="text-surface-400 text-sm">{t('dashboard.totalOrders')}</p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-12 translate-x-12" />
        </div>

        {/* Customers */}
        {!isCashier && (
          <>
            <div className="stat-card">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-purple-500/15 rounded-xl">
                    <Users size={22} className="text-purple-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold dark:text-white text-surface-900 mb-1">{employeeKPIs.totalCustomers}</p>
                <p className="text-surface-400 text-sm">{t('dashboard.customers')}</p>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -translate-y-12 translate-x-12" />
            </div>

            {/* Tables */}
            <div className="stat-card">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-amber-500/15 rounded-xl">
                    <Table2 size={22} className="text-amber-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold dark:text-white text-surface-900 mb-1">{employeeKPIs.occupiedTables}</p>
                <p className="text-surface-400 text-sm">{t('tables.occupied')}</p>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -translate-y-12 translate-x-12" />
            </div>
          </>
        )}
      </div>

      {/* Order Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 card-hover">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-xl border border-amber-400/20">
              <Flame size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-white text-surface-900">{employeeKPIs.newOrders}</p>
              <p className="text-xs text-surface-400 font-medium">{t('orders.new')}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 card-hover">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-400/20 to-coral-500/20 rounded-xl border border-orange-400/20">
              <ChefHat size={20} className="text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-white text-surface-900">{employeeKPIs.preparingOrders}</p>
              <p className="text-xs text-surface-400 font-medium">{t('orders.preparing')}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 card-hover">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-brand-400/20 to-accent-400/20 rounded-xl border border-brand-400/20">
              <CheckCircle size={20} className="text-brand-400" />
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-white text-surface-900">{employeeKPIs.readyOrders}</p>
              <p className="text-xs text-surface-400 font-medium">{t('orders.ready')}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 card-hover">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-xl border border-blue-400/20">
              <Truck size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-white text-surface-900">{employeeKPIs.deliveryOrders}</p>
              <p className="text-xs text-surface-400 font-medium">{t('nav.orders')}</p>
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
              <div className={`p-2.5 rounded-xl ${employeeKPIs.todayProfit >= 0 ? 'bg-brand-500/15' : 'bg-coral-500/15'}`}>
                {employeeKPIs.todayProfit >= 0 
                  ? <TrendingUp size={20} className="text-brand-400" />
                  : <TrendingDown size={20} className="text-coral-400" />
                }
              </div>
              <h3 className="font-semibold dark:text-white text-surface-900">{t('finance.profit')}</h3>
            </div>
            <p className={`text-3xl font-bold ${employeeKPIs.todayProfit >= 0 ? 'text-brand-400' : 'text-coral-400'}`}>
              {formatCurrency(employeeKPIs.todayProfit)}
            </p>
          </div>

          {/* Top Products */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-brand-500/15 rounded-xl">
                <Zap size={20} className="text-brand-400" />
              </div>
              <h3 className="font-semibold dark:text-white text-surface-900">{t('nav.menu')}</h3>
            </div>
            {employeeKPIs.topProducts.length === 0 ? (
              <p className="text-sm text-surface-500">{t('common.noData')}</p>
            ) : (
              <div className="space-y-3">
                {employeeKPIs.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                      ${index === 0 ? 'bg-brand-500/20 text-brand-400 border border-brand-500/20'
                        : index === 1 ? 'dark:bg-surface-700 bg-surface-200 text-surface-300 dark:border-surface-600 border-surface-300 border'
                        : 'dark:bg-surface-800 bg-surface-200 text-surface-400 dark:border-surface-700 border-surface-300 border'}`}>
                      {index + 1}
                    </span>
                    <span className="text-sm dark:text-surface-200 text-surface-700 flex-1 truncate">{product.name}</span>
                    <span className="text-sm font-semibold text-brand-400">{product.quantity}x</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stock Alerts */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-500/15 rounded-xl">
                <AlertTriangle size={20} className="text-amber-400" />
              </div>
              <h3 className="font-semibold dark:text-white text-surface-900">{t('nav.kitchen')}</h3>
            </div>
            {employeeKPIs.stockAlerts.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle size={32} className="mx-auto text-brand-400 mb-2" />
                <p className="text-sm text-surface-500">{t('common.noData')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {employeeKPIs.stockAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-coral-500/5 rounded-xl border border-coral-500/10">
                    <span className="text-sm dark:text-surface-200 text-surface-700 truncate">{alert.name}</span>
                    <span className="text-sm font-semibold text-coral-400">
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
