import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useNotificationStore } from '../stores/notificationStore';
import {
  LogOut, User, X, LayoutDashboard, ShoppingCart, Table2,
  ChefHat, UtensilsCrossed, Users, DollarSign, FileText, Settings,
  ClipboardList, Utensils, MoreHorizontal, Bell, CheckCheck, ChevronRight
} from 'lucide-react';
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
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    setMoreOpen(false);
    setNotifOpen(false);
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

  const recentNotifications = notifications.slice(0, 8);

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-hidden">
      {/* Top App Bar */}
      <header
        className="shrink-0 z-30 glass border-b border-gray-100"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleGradient} flex items-center justify-center shadow-md`}>
              <Utensils size={16} className="text-white" />
            </div>
            <span className="text-base font-display font-bold text-gray-900">{companyName}</span>
          </div>

          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setMoreOpen(false); }}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Bell size={22} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
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

      {/* Notifications Popup */}
      {notifOpen && (
        <div className="absolute top-[calc(3.5rem+env(safe-area-inset-top))] right-0 z-50 w-full max-w-sm">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setNotifOpen(false)}
          />
          <div className="relative mx-3 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-down max-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-brand-600 font-semibold flex items-center gap-1"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setNotifOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {recentNotifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No notifications</p>
                </div>
              ) : (
                recentNotifications.map((notif) => (
                  <button
                    key={notif._id}
                    onClick={() => {
                      markAsRead(notif._id);
                      if (notif.entity === 'order' && notif.entityId) {
                        navigate('/orders/active');
                        setNotifOpen(false);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                      !notif.isRead ? 'bg-brand-50/30' : ''
                    }`}
                  >
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-brand-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-snug">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>

            <Link
              to="/notifications"
              onClick={() => setNotifOpen(false)}
              className="flex items-center justify-center gap-1 py-3 text-sm font-semibold text-brand-600 border-t border-gray-100 hover:bg-gray-50"
            >
              View all notifications
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Page content - scrollable */}
      <main className="flex-1 overflow-y-auto" role="main">
        <div className="p-4 pb-20">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-gray-200"
      >
        <div className="flex items-center justify-around h-[56px] px-1" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {bottomTabs.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-400'
                }`}>
                  <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
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
              onClick={() => { setMoreOpen(true); setNotifOpen(false); }}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
            >
              <div className="p-1.5 rounded-xl text-gray-400">
                <MoreHorizontal size={21} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-semibold leading-tight text-gray-400">
                More
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* More Items Bottom Sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 animate-slide-up">
            <div className="bg-white rounded-t-3xl shadow-2xl border border-gray-100 max-h-[70vh] overflow-hidden">
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
                <h3 className="text-lg font-display font-bold text-gray-900">More</h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

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

                  <Link
                    to="/profile"
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all duration-200"
                  >
                    <User size={24} strokeWidth={2} />
                    <span className="text-xs font-semibold text-center leading-tight">
                      Profile
                    </span>
                  </Link>

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
