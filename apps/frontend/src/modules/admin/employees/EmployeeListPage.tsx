import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../../services/auth.service';
import { useI18n } from '../../../i18n/I18nContext';
import { UserDTO } from '../../../types';
import { Plus, Edit, Search } from 'lucide-react';

export function EmployeeListPage() {
  const [employees, setEmployees] = useState<UserDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useI18n();

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const { employees: data, total: t } = await authService.getEmployees(page, 20, {
        role: roleFilter || undefined,
      });
      setEmployees(data);
      setTotal(t);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, roleFilter]);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    manager: 'Manager',
    cashier: 'Cashier',
    server: 'Server',
    chef: 'Chef',
    stock_manager: 'Stock',
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-display font-bold text-gray-900">{t('employees.title')}</h1>
        <Link
          to="/admin/employees/new"
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{t('common.create')}</span>
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('employees.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        >
          <option value="">{t('employees.title')}</option>
          {Object.entries(roleLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-12 text-center">
          <p className="text-gray-500 font-medium">{t('employees.noEmployees')}</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card view */}
          <div className="md:hidden space-y-2">
            {filteredEmployees.map((employee) => (
              <div key={employee._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {employee.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{employee.name}</p>
                    <p className="text-xs text-gray-500">{employee.phone || '-'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold bg-brand-50 text-brand-600 px-2 py-1 rounded-full">
                      {roleLabels[employee.role]}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${employee.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Link
                    to={`/admin/employees/${employee._id}/edit`}
                    className="text-xs font-semibold text-brand-600 flex items-center gap-1"
                  >
                    <Edit size={14} />
                    {t('common.edit')}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table view - fits screen */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('common.name')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('common.phone')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('employees.role')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('employees.status')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee._id} className="table-row">
                    <td className="px-5 py-3">
                      <span className="font-semibold text-sm text-gray-900">{employee.name}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{employee.phone || '-'}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold bg-brand-50 text-brand-600 px-2 py-1 rounded-full">
                        {roleLabels[employee.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        employee.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {employee.isActive ? t('employees.active') : t('employees.inactive')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to={`/admin/employees/${employee._id}/edit`}
                        className="text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                      >
                        <Edit size={14} />
                        {t('common.edit')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 20 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {((page - 1) * 20) + 1}-{Math.min(page * 20, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50"
                >
                  {t('common.previous')}
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 20 >= total}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
