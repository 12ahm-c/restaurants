import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerStore } from '../../stores/customerStore';

export function LoyaltyRankingPage() {
  const { loyaltyRanking, loading, error, fetchLoyaltyRanking } = useCustomerStore();
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    fetchLoyaltyRanking(limit);
  }, [limit]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Loyalty Ranking</h1>
        <p className="text-gray-600">Top customers by loyalty points</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Show Top</label>
        <select
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value, 10))}
          className="w-48 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
          <option value={100}>Top 100</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
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
            ) : loyaltyRanking.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No customers found
                </td>
              </tr>
            ) : (
              loyaltyRanking.map((customer, index) => (
                <tr key={customer._id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : index === 1
                          ? 'bg-gray-100 text-gray-800'
                          : index === 2
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {customer.phone}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 text-xs font-semibold text-green-800">
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
    </div>
  );
}
