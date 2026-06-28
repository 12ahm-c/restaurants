import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerStore } from '../../stores/customerStore';
import { useDebounce } from '../../hooks/useDebounce';

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
        <p className="text-gray-600">Manage your customers and loyalty program</p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="w-96">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <Link
          to="/customers/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Customer
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loyalty Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No customers found
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer._id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {customer.phone}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {customer.email || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-800">
                      {customer.loyaltyPoints} pts
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <Link
                      to={`/customers/${customer._id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of{' '}
            {total} customers
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page * limit >= total}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
