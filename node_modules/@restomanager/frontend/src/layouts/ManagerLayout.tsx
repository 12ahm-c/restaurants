import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';

export function ManagerLayout() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/dashboard/manager', label: 'Manager Dashboard' },
    { path: '/pos', label: 'POS' },
    { path: '/tables', label: 'Tables' },
    { path: '/kitchen', label: 'Kitchen' },
    { path: '/menu', label: 'Menu' },
    { path: '/customers', label: 'Customers' },
    { path: '/reports', label: 'Reports' },
    { path: '/admin/employees', label: 'Employees' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 lg:hidden"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-indigo-600">RestoManager</span>
              </div>
              <div className="hidden lg:ml-8 lg:flex lg:space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === item.path
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/profile"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <User size={20} />
                <span className="hidden sm:inline text-sm">{user?.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
