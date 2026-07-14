import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import {
  LogOut, User, X, LayoutDashboard, ShoppingCart, Table2,
  ChefHat, UtensilsCrossed, Users, DollarSign, FileText, Settings,
  ClipboardList, Utensils, MoreHorizontal
} from 'lucide-react';
import { NotificationBadge } from '../components/notifications/NotificationBadge';
import { UserRole } from '../types';

const NAV_CONFIG: Record<UserRole, { path: string; label: string; icon: any }[]> = {
  owner: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/orders/active', label: 'Orders', icon: ClipboardList },
    { path: '/tables', label: 'Tables', icon: Table2 },
    { path: '/kitchen', label: 'Kitchen', icon: ChefHat },
    { path: '/menu/products', label: 'Menu', icon: UtensilsCrossed },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/finance', label: 'Finance', icon: DollarSign },
    { path: '/admin/employees', label: 'Employees', icon: User },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  manager: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/orders/active', label: 'Orders', icon: ClipboardList },
    { path: '/tables', label: 'Tables', icon: Table2 },
    { path: '/kitchen', label: 'Kitchen', icon: ChefHat },
    { path: '/menu/products', label: 'Menu', icon: UtensilsCrossed },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/finance', label: 'Finance', icon: DollarSign },
    { path: '/admin/employees', label: 'Employees', icon: User },
    { path: '/reports', label: 'Reports', icon: FileText },
  ],
  cashier: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/pos', label: 'POS', icon: ShoppingCart },
    { path: '/orders/active', label: 'Orders', icon: ClipboardList },
    { path: '/customers', label: 'Customers', icon: Users },
  ],
  server: [
    { path: '/tables', label: 'Tables', icon: Table2 },
    { path: '/orders/active', label: 'Orders', icon: ClipboardList },
    { path: '/customers', label: 'Customers', icon: Users },
  ],
  chef: [
    { path: '/kitchen', label: 'Kitchen', icon: ChefHat },
    { path: '/menu/products', label: 'Menu', icon: UtensilsCrossed },
  ],
  stock_manager: [
    { path: '/kitchen', label: 'Kitchen', icon: ChefHat },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'from-brand-500 to-orange-600',
  manager: 'from-brand-500 to-amber-500',
  cashier: 'from-emerald-500 to-teal-500',
  server: 'from-blue-500 to-indigo-500',
  chef: 'from-red-500 to-rose-500',
  stock_manager: 'from-purple-500 to-violet-500',
};

const BOTTOM_TAB_COUNT = 4;

export function EmployeeLayout() {
  const { user, logout } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = user ? NAV_CONFIG[user.role] || [] : [];
  const companyName = settings?.company_name || 'RestoManager';
  const roleGradient = ROLE_COLORS[user?.role || 'owner'];

  const bottomTabs = navItems.slice(0, BOTTOM_TAB_COUNT);
  const moreItems = navItems.slice(BOTTOM_TAB_COUNT);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top App Bar */}
      <header
        className="sticky top-0 z-30 glass border-b border-gray-100"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleGradient} flex items-center justify-center shadow-md`}>
              <Utensils size={16} className="text-white" />
            </div>
            <span className="text-base font-display font-bold text-gray-900">{companyName}</span>
          </div>

          <div className="flex items-center gap-1">
            <NotificationBadge />
            <Link
              to="/profile"
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white text-xs font-semibold`}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-20" role="main">
        <div className="p-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-gray-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {bottomTabs.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 rounded-xl transition-all duration-200"
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-400'
                }`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-semibold leading-tight ${
                  isActive ? 'text-brand-600' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {moreItems.length > 0 && (
            <button
              onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 rounded-xl transition-all duration-200"
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                moreOpen
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-400'
              }`}>
                <MoreHorizontal size={22} strokeWidth={2} />
              </div>
              <span className={`text-[10px] font-semibold leading-tight ${
                moreOpen ? 'text-brand-600' : 'text-gray-400'
              }`}>
                More
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* More Items Bottom Sheet Overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-50" style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 animate-slide-up">
            <div className="bg-white rounded-t-3xl shadow-2xl border border-gray-100 max-h-[70vh] overflow-hidden">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
                <h3 className="text-lg font-display font-bold text-gray-900">More</h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Items grid */}
              <div className="p-4 overflow-y-auto max-h-[55vh]">
                <div className="grid grid-cols-3 gap-3">
                  {moreItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 ${
                          isActive
                            ? 'bg-brand-50 text-brand-600 shadow-sm'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-xs font-semibold text-center leading-tight">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}

                  {/* Profile */}
                  <Link
                    to="/profile"
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all duration-200"
                  >
                    <User size={24} strokeWidth={2} />
                    <span className="text-xs font-semibold text-center leading-tight">
                      Profile
                    </span>
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-200"
                  >
                    <LogOut size={24} strokeWidth={2} />
                    <span className="text-xs font-semibold text-center leading-tight">
                      Logout
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
