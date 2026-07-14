import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerStore } from '../../stores/customerStore';
import { useDebounce } from '../../hooks/useDebounce';
import { useI18n } from '../../i18n/I18nContext';
import { Search, Plus, Users } from 'lucide-react';

export function CustomerListPage() {
  const {
    customers,
    total,
    page,
    limit,
    loading,
    error,
    filters,
    fetchCustomers,
  } = useCustomerStore();
  const { t } = useI18n();

  const [search, setSearch] = useState(filters.search || '');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchCustomers({
      ...filters,
      search: debouncedSearch,
      page: 1,
    });
  }, [debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    fetchCustomers({
      ...filters,
      page: newPage,
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="text-xl font-display font-bold text-gray-900">{t('customers.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} {t('customers.title').toLowerCase()}</p>
      </div>

      {/* Search + Add row */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('customers.search')}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
        <Link
          to="/customers/new"
          className="btn-primary flex items-center gap-2 shrink-0 text-sm"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{t('common.create')}</span>
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {/* Customer list - cards on mobile */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-12 text-center">
          <Users size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t('customers.noCustomers')}</p>
          <Link to="/customers/new" className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
            <Plus size={16} />
            {t('customers.add')}
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: Card view */}
          <div className="md:hidden space-y-2">
            {customers.map((customer) => (
              <Link
                key={customer._id}
                to={`/customers/${customer._id}`}
                className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{customer.phone}</p>
                  </div>
                  <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-full shrink-0">
                    {customer.loyaltyPoints} pts
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: Table view */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('common.name')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('common.phone')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('customers.loyaltyPoints')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id} className="table-row">
                    <td className="px-5 py-3">
                      <span className="font-semibold text-sm text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{customer.phone}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
                        {customer.loyaltyPoints} pts
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to={`/customers/${customer._id}`}
                        className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                      >
                        {t('common.edit')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50"
                >
                  {t('common.previous')}
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page * limit >= total}
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
