import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EmployeeLayout } from './layouts/EmployeeLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { SocketProvider } from './contexts/SocketContext';
import { I18nProvider } from './i18n/I18nContext';

const LoginPage = lazy(() => import('./modules/auth/login/LoginPage').then(m => ({ default: m.LoginPage })));
const ProfilePage = lazy(() => import('./modules/auth/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const EmployeeListPage = lazy(() => import('./modules/admin/employees/EmployeeListPage').then(m => ({ default: m.EmployeeListPage })));
const EmployeeCreatePage = lazy(() => import('./modules/admin/employees/EmployeeCreatePage').then(m => ({ default: m.EmployeeCreatePage })));
const EmployeeEditPage = lazy(() => import('./modules/admin/employees/EmployeeEditPage').then(m => ({ default: m.EmployeeEditPage })));
const TentMapPage = lazy(() => import('./modules/tents/TentMapPage').then(m => ({ default: m.TentMapPage })));
const POSPage = lazy(() => import('./modules/pos/POSPage').then(m => ({ default: m.POSPage })));
const ActiveOrdersPage = lazy(() => import('./modules/orders/ActiveOrdersPage').then(m => ({ default: m.ActiveOrdersPage })));
const KitchenPage = lazy(() => import('./modules/kitchen/KitchenPage').then(m => ({ default: m.KitchenPage })));
const ProductListPage = lazy(() => import('./modules/menu/products/ProductListPage').then(m => ({ default: m.ProductListPage })));
const ProductDetailPage = lazy(() => import('./modules/menu/products/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const ProductFormPage = lazy(() => import('./modules/menu/products/ProductFormPage').then(m => ({ default: m.ProductFormPage })));
const CategoryListPage = lazy(() => import('./modules/menu/categories/CategoryListPage').then(m => ({ default: m.CategoryListPage })));
const CustomerListPage = lazy(() => import('./modules/customer/CustomerListPage').then(m => ({ default: m.CustomerListPage })));
const CustomerDetailPage = lazy(() => import('./modules/customer/CustomerDetailPage').then(m => ({ default: m.CustomerDetailPage })));
const CustomerCreatePage = lazy(() => import('./modules/customer/CustomerCreatePage').then(m => ({ default: m.CustomerCreatePage })));
const LoyaltyRankingPage = lazy(() => import('./modules/customer/LoyaltyRankingPage').then(m => ({ default: m.LoyaltyRankingPage })));
const CustomerEditPage = lazy(() => import('./modules/customer/CustomerEditPage').then(m => ({ default: m.CustomerEditPage })));
const FinancePage = lazy(() => import('./modules/finance/FinancePage').then(m => ({ default: m.FinancePage })));
const EmployeeDashboard = lazy(() => import('./modules/dashboard/EmployeeDashboard').then(m => ({ default: m.EmployeeDashboard })));
const ManagerDashboard = lazy(() => import('./modules/dashboard/ManagerDashboard').then(m => ({ default: m.ManagerDashboard })));
const ReportsPage = lazy(() => import('./modules/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const NotificationsPage = lazy(() => import('./modules/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const SettingsPage = lazy(() => import('./modules/admin/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LogsPage = lazy(() => import('./modules/admin/logs/LogsPage').then(m => ({ default: m.LogsPage })));
const InventoryPage = lazy(() => import('./modules/inventory/InventoryPage').then(m => ({ default: m.InventoryPage })));
const SuppliersPage = lazy(() => import('./modules/suppliers/SuppliersPage').then(m => ({ default: m.SuppliersPage })));

function App() {
  return (
    <I18nProvider>
      <SocketProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner message="Loading..." />}>
            <Routes>
            <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <EmployeeLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="dashboard"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'cashier']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="profile" element={<ProfilePage />} />

            {/* POS - cashier, owner, manager */}
            <Route
              path="pos"
              element={
                <ProtectedRoute allowedRoles={['cashier', 'owner', 'manager']}>
                  <POSPage />
                </ProtectedRoute>
              }
            />

            {/* Tents - server, cashier, owner, manager */}
            <Route
              path="tents"
              element={
                <ProtectedRoute allowedRoles={['server', 'cashier', 'owner', 'manager']}>
                  <TentMapPage />
                </ProtectedRoute>
              }
            />

            {/* Orders - all roles */}
            <Route path="orders/active" element={<ActiveOrdersPage />} />

            {/* Kitchen - chef, owner, manager, stock_manager */}
            <Route
              path="kitchen"
              element={
                <ProtectedRoute allowedRoles={['chef']}>
                  <KitchenPage />
                </ProtectedRoute>
              }
            />

            {/* Menu - owner, manager, chef (view only) */}
            <Route
              path="menu/products"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'chef']}>
                  <ProductListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="menu/products/new"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <ProductFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="menu/products/:id"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'chef']}>
                  <ProductDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="menu/products/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <ProductFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="menu/categories"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <CategoryListPage />
                </ProtectedRoute>
              }
            />

            {/* Customers - owner, manager, cashier, server */}
            <Route
              path="customers"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'cashier', 'server']}>
                  <CustomerListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/new"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'cashier', 'server']}>
                  <CustomerCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/:id"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'cashier', 'server']}>
                  <CustomerDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'cashier', 'server']}>
                  <CustomerEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/loyalty/ranking"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <LoyaltyRankingPage />
                </ProtectedRoute>
              }
            />

            {/* Manager Dashboard - owner, manager */}
            <Route
              path="dashboard/manager"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Reports - owner, manager */}
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Finance - owner, manager */}
            <Route
              path="finance"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <FinancePage />
                </ProtectedRoute>
              }
            />

            {/* Notifications - all roles */}
            <Route path="notifications" element={<NotificationsPage />} />

            {/* Inventory - owner, manager, stock_manager */}
            <Route
              path="inventory"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'stock_manager']}>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />

            {/* Suppliers - owner, manager, stock_manager */}
            <Route
              path="suppliers"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'stock_manager']}>
                  <SuppliersPage />
                </ProtectedRoute>
              }
            />

            {/* Employees - owner, manager */}
            <Route
              path="admin/employees"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <EmployeeListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/employees/new"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <EmployeeCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/employees/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <EmployeeEditPage />
                </ProtectedRoute>
              }
            />

            {/* Owner only */}
            <Route
              path="admin/settings"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/logs"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <LogsPage />
                </ProtectedRoute>
              }
            />

            <Route index element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </SocketProvider>
    </I18nProvider>
  );
}

export default App;
