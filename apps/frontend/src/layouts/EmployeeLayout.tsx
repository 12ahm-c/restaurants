import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { 
  LogOut, User, Menu, X, LayoutDashboard, ShoppingCart, Table2, 
  ChefHat, UtensilsCrossed, Users, DollarSign, FileText, Settings,
  ClipboardList, ChevronLeft, Utensils
} from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
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

export function EmployeeLayout() {
  const { user, logout } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = user ? NAV_CONFIG[user.role] || [] : [];
  const companyName = settings?.company_name || 'RestoManager';
  const roleGradient = ROLE_COLORS[user?.role || 'owner'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 h-full z-50 transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-[72px]' : 'w-64'}
          bg-white border-r border-gray-100 shadow-xl lg:shadow-none`}
        style={{ top: 'env(safe-area-inset-top)' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleGradient} flex items-center justify-center shadow-lg`}>
                <Utensils size={18} className="text-white" />
              </div>
              {!collapsed && (
                <span className="text-lg font-display font-bold text-gray-900">{companyName}</span>
              )}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={18} className={`text-gray-400 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => sidebarOpen && toggleSidebar()}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-brand-50 to-orange-50 text-brand-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={20} className={isActive ? 'text-brand-500' : 'text-gray-400'} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-gray-100">
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50`}>
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white text-sm font-semibold shadow-md`}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              )}
              {!collapsed && (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass border-b border-gray-100" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleGradient} flex items-center justify-center shadow-md`}>
                  <Utensils size={16} className="text-white" />
                </div>
                <span className="text-base font-display font-bold text-gray-900 hidden sm:inline">{companyName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBadge />
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white text-xs font-semibold`}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-700">{user?.name}</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
