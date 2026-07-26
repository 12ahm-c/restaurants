import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LogOut, User, X, LayoutDashboard, ShoppingCart, Tent,
  ChefHat, UtensilsCrossed, Users, DollarSign, FileText, Settings,
  ClipboardList, MoreHorizontal, Bell, CheckCheck, ChevronRight,
  Search, Sun, Moon, Package, Truck
} from 'lucide-react';
import { UserRole } from '../types';

const ROLE_COLORS: Record<string, string> = {
  owner: 'from-brand-500 to-accent-500',
  manager: 'from-brand-500 to-amber-400',
  cashier: 'from-emerald-400 to-cyan-400',
  server: 'from-blue-400 to-indigo-400',
  chef: 'from-coral-400 to-rose-400',
  stock_manager: 'from-purple-400 to-violet-400',
};

const ROLE_ICONS: Record<string, string> = {
  owner: '👑',
  manager: '📊',
  cashier: '💳',
  server: '🍽️',
  chef: '👨‍🍳',
  stock_manager: '📦',
};

function getNavConfig(t: (key: string) => string): Record<UserRole, { path: string; label: string; icon: any; section?: string }[]> {
  return {
    owner: [
      { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, section: 'main' },
      { path: '/orders/active', label: t('nav.orders'), icon: ClipboardList, section: 'main' },
      { path: '/tents', label: t('nav.tents'), icon: Tent, section: 'main' },
      { path: '/menu/products', label: t('nav.menu'), icon: UtensilsCrossed, section: 'operations' },
      { path: '/inventory', label: t('nav.inventory'), icon: Package, section: 'operations' },
      { path: '/suppliers', label: t('nav.suppliers'), icon: Truck, section: 'operations' },
      { path: '/customers', label: t('nav.customers'), icon: Users, section: 'operations' },
      { path: '/finance', label: t('nav.finance'), icon: DollarSign, section: 'management' },
      { path: '/admin/employees', label: t('nav.employees'), icon: User, section: 'management' },
      { path: '/reports', label: t('nav.reports'), icon: FileText, section: 'management' },
      { path: '/admin/settings', label: t('nav.settings'), icon: Settings, section: 'management' },
    ],
    manager: [
      { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, section: 'main' },
      { path: '/orders/active', label: t('nav.orders'), icon: ClipboardList, section: 'main' },
      { path: '/tents', label: t('nav.tents'), icon: Tent, section: 'main' },
      { path: '/menu/products', label: t('nav.menu'), icon: UtensilsCrossed, section: 'operations' },
      { path: '/inventory', label: t('nav.inventory'), icon: Package, section: 'operations' },
      { path: '/suppliers', label: t('nav.suppliers'), icon: Truck, section: 'operations' },
      { path: '/customers', label: t('nav.customers'), icon: Users, section: 'operations' },
      { path: '/finance', label: t('nav.finance'), icon: DollarSign, section: 'management' },
      { path: '/admin/employees', label: t('nav.employees'), icon: User, section: 'management' },
      { path: '/reports', label: t('nav.reports'), icon: FileText, section: 'management' },
    ],
    cashier: [
      { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, section: 'main' },
      { path: '/pos', label: t('nav.pos'), icon: ShoppingCart, section: 'main' },
      { path: '/orders/active', label: t('nav.orders'), icon: ClipboardList, section: 'main' },
      { path: '/customers', label: t('nav.customers'), icon: Users, section: 'operations' },
    ],
    server: [
      { path: '/tents', label: t('nav.tents'), icon: Tent, section: 'main' },
      { path: '/orders/active', label: t('nav.orders'), icon: ClipboardList, section: 'main' },
      { path: '/customers', label: t('nav.customers'), icon: Users, section: 'operations' },
    ],
    chef: [
      { path: '/kitchen', label: t('nav.kitchen'), icon: ChefHat, section: 'main' },
      { path: '/menu/products', label: t('nav.menu'), icon: UtensilsCrossed, section: 'operations' },
    ],
    stock_manager: [
      { path: '/inventory', label: t('nav.inventory'), icon: Package, section: 'main' },
      { path: '/suppliers', label: t('nav.suppliers'), icon: Truck, section: 'main' },
      { path: '/menu/products', label: t('nav.menu'), icon: UtensilsCrossed, section: 'main' },
    ],
  };
}

const BOTTOM_TAB_COUNT = 3;

export function EmployeeLayout() {
  const { user, logout } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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

  const navItems = user ? getNavConfig(t)[user.role] || [] : [];
  const companyName = settings?.company_name || 'RestoManager';
  const roleGradient = ROLE_COLORS[user?.role || 'owner'];

  const bottomTabs = navItems.slice(0, BOTTOM_TAB_COUNT);
  const moreItems = navItems.slice(BOTTOM_TAB_COUNT);

  const recentNotifications = notifications.slice(0, 8);

  return (
    <div className="h-[100dvh] dark:bg-surface-950 bg-surface-50 flex flex-col overflow-hidden">
      {/* Top App Bar */}
      <header
        className="shrink-0 z-30 dark glass border-b dark:border-white/5 border-black/5"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left - Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border dark:border-white/10 border-black/10 shrink-0 bg-surface-900 flex items-center justify-center">
              <img src={settings?.logo || '/app-icon.jpg'} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-display font-bold dark:text-white text-surface-900">{companyName}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">{ROLE_ICONS[user?.role || 'owner']}</span>
                <span className="text-[11px] font-medium dark:text-surface-400 text-surface-500 capitalize">{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Center - Search (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 dark:text-surface-500 text-surface-400" size={18} />
              <input
                type="text"
                placeholder={`${t('common.search')}...`}
                className="w-full pl-10 pr-4 py-2.5 dark:bg-surface-900/50 bg-white border dark:border-white/5 border-black/10 rounded-xl text-sm dark:text-white text-surface-900 dark:placeholder-surface-500 placeholder-surface-400 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2.5 rounded-xl dark:hover:bg-white/5 hover:bg-black/5 transition-colors dark:text-surface-400 text-surface-500 dark:hover:text-white hover:text-surface-900"
            >
              <Search size={20} />
            </button>

            {/* Notifications */}
            <button
              onClick={() => { setNotifOpen(!notifOpen); setMoreOpen(false); }}
              className="relative p-2.5 rounded-xl dark:hover:bg-white/5 hover:bg-black/5 transition-colors dark:text-surface-400 text-surface-500 dark:hover:text-white hover:text-surface-900"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-coral-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse-soft">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl dark:hover:bg-white/5 hover:bg-black/5 transition-colors dark:text-surface-400 text-surface-500 dark:hover:text-white hover:text-surface-900"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Profile */}
            <Link
              to="/profile"
              className="p-1 rounded-xl dark:hover:bg-white/5 hover:bg-black/5 transition-colors"
              title="Profile"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white text-sm font-semibold shadow-lg`}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl hover:bg-coral-500/10 transition-colors dark:text-surface-400 text-surface-500 hover:text-coral-400"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="md:hidden px-4 pb-3 animate-slide-down">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 dark:text-surface-500 text-surface-400" size={18} />
              <input
                type="text"
                placeholder={`${t('common.search')}...`}
                className="w-full pl-10 pr-4 py-2.5 dark:bg-surface-900/50 bg-white border dark:border-white/5 border-black/10 rounded-xl text-sm dark:text-white text-surface-900 dark:placeholder-surface-500 placeholder-surface-400 focus:outline-none focus:border-brand-500/50 transition-all"
                autoFocus
              />
            </div>
          </div>
        )}
      </header>

      {/* Notifications Popup */}
      {notifOpen && (
        <div className="absolute top-[calc(4rem+env(safe-area-inset-top))] right-0 z-50 w-full max-w-sm">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setNotifOpen(false)}
          />
          <div className="relative mx-3 mt-2 dark:bg-surface-900 bg-white rounded-2xl shadow-elevated dark:border-white/5 border-black/10 overflow-hidden animate-slide-down max-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 dark:border-white/5 border-black/10 border-b">
              <h3 className="text-sm font-bold dark:text-white text-surface-900">{t('notifications.title')}</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-brand-400 font-semibold flex items-center gap-1 hover:text-brand-300 transition-colors"
                  >
                    <CheckCheck size={14} />
                    {t('notifications.markAllRead')}
                  </button>
                )}
                <button
                  onClick={() => setNotifOpen(false)}
                  className="p-1 rounded-lg dark:hover:bg-white/5 hover:bg-black/5 transition-colors"
                >
                  <X size={16} className="dark:text-surface-400 text-surface-500" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {recentNotifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell size={32} className="dark:text-surface-600 text-surface-300 mx-auto mb-2" />
                  <p className="text-sm dark:text-surface-500 text-surface-400">{t('notifications.noNotifications')}</p>
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
                    className={`w-full text-left px-4 py-3 dark:border-white/5 border-black/5 border-b dark:hover:bg-white/5 hover:bg-surface-50 transition-colors flex items-start gap-3 ${
                      !notif.isRead ? 'bg-brand-500/5' : ''
                    }`}
                  >
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-brand-400' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm dark:text-surface-200 text-surface-700 leading-snug">{notif.message}</p>
                      <p className="text-xs dark:text-surface-500 text-surface-400 mt-1">
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
              className="flex items-center justify-center gap-1 py-3 text-sm font-semibold text-brand-400 dark:border-white/5 border-black/10 border-t dark:hover:bg-white/5 hover:bg-surface-50 transition-colors"
            >
              {t('notifications.viewAll')}
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Page content - scrollable */}
      <main className="flex-1 overflow-y-auto" role="main">
        <div className="p-4 pb-24">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav
        className="shrink-0 z-40 dark glass border-t dark:border-white/5 border-black/5"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-[60px] px-1">
          {bottomTabs.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center gap-1 flex-1 py-1.5 group"
              >
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 shadow-lg shadow-brand-500/10'
                    : 'dark:text-surface-500 text-surface-400 dark:group-hover:text-surface-300 group-hover:text-surface-700 dark:group-hover:bg-white/5 group-hover:bg-black/5'
                }`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-semibold leading-tight transition-colors ${
                  isActive ? 'text-brand-400' : 'dark:text-surface-500 text-surface-400 dark:group-hover:text-surface-300 group-hover:text-surface-700'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 w-8 h-0.5 bg-gradient-to-r from-brand-400 to-accent-400 rounded-full" />
                )}
              </Link>
            );
          })}

          {moreItems.length > 0 && (
            <button
              onClick={() => { setMoreOpen(true); setNotifOpen(false); }}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-1.5 group"
            >
              <div className="p-2 rounded-xl dark:text-surface-500 text-surface-400 dark:group-hover:text-surface-300 group-hover:text-surface-700 dark:group-hover:bg-white/5 group-hover:bg-black/5 transition-all duration-300">
                <MoreHorizontal size={22} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-semibold leading-tight dark:text-surface-500 text-surface-400 dark:group-hover:text-surface-300 group-hover:text-surface-700 transition-colors">
                {t('nav.more')}
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* More Items Bottom Sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 animate-slide-up">
            <div className="bottom-sheet max-h-[70vh] overflow-hidden">
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 dark:bg-surface-600 bg-surface-300 rounded-full" />
              </div>

              <div className="flex items-center justify-between px-5 pb-3 dark:border-white/5 border-black/10 border-b">
                <h3 className="text-lg font-display font-bold dark:text-white text-surface-900">
                  {moreItems.length > 0 ? t('nav.more') : t('nav.profile')}
                </h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-2 rounded-xl dark:hover:bg-white/5 hover:bg-black/5 transition-colors"
                >
                  <X size={20} className="dark:text-surface-400 text-surface-500" />
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
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 ${
                          isActive
                            ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                            : 'dark:bg-white/5 bg-surface-100 dark:text-surface-400 text-surface-600 dark:hover:bg-white/10 hover:bg-surface-200 dark:hover:text-surface-200 hover:text-surface-900 dark:border-white/5 border-black/5 border'
                        }`}
                      >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-xs font-semibold text-center leading-tight">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
