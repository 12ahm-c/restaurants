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
        <h1 className="text-2xl font-bold text-white">Loyalty Ranking</h1>
        <p className="text-surface-400">Top customers by loyalty points</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-surface-300 mb-1">Show Top</label>
        <select
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value, 10))}
          className="input-field w-48"
        >
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
          <option value={100}>Top 100</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-coral-500/10 p-4 text-coral-400">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border border-white/5 card shadow">
        <table className="min-w-full divide-y divide-white/5">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                Loyalty Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-surface-900">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-surface-400">
                  Loading...
                </td>
              </tr>
            ) : loyaltyRanking.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-surface-400">
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
                          ? 'bg-amber-500/20 text-amber-400'
                          : index === 1
                          ? 'bg-surface-700 text-surface-300'
                          : index === 2
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-white">
                      {customer.firstName} {customer.lastName}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-surface-400">
                    {customer.phone}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-brand-500/20 px-2 text-xs font-semibold text-brand-400">
                      {customer.loyaltyPoints} pts
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <Link
                      to={`/customers/${customer._id}`}
                      className="text-brand-400 hover:text-brand-300"
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
