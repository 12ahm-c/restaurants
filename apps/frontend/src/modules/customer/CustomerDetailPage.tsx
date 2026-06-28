import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCustomerStore } from '../../stores/customerStore';
import { RedemptionModal } from '../../components/customers/RedemptionModal';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    selectedCustomer,
    totalSpent,
    lastPurchaseAt,
    totalOrders,
    loyaltyHistory,
    loyaltyHistoryTotal,
    loading,
    error,
    fetchCustomerById,
    fetchCustomerLoyaltyHistory,
    clearSelectedItem,
  } = useCustomerStore();

  const [loyaltyPage, setLoyaltyPage] = useState(1);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCustomerById(id);
      fetchCustomerLoyaltyHistory(id, 1, 10);
    }
    return () => clearSelectedItem();
  }, [id]);

  const handleLoyaltyPageChange = (newPage: number) => {
    if (id) {
      setLoyaltyPage(newPage);
      fetchCustomerLoyaltyHistory(id, newPage, 10);
    }
  };

  if (loading && !selectedCustomer) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  if (!selectedCustomer) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Customer not found</div>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/customers')}
          className="text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Customers
        </button>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          {selectedCustomer.firstName} {selectedCustomer.lastName}
        </h1>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Customer Information</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedCustomer.phone}</dd>
            </div>
            {selectedCustomer.email && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{selectedCustomer.email}</dd>
              </div>
            )}
            {selectedCustomer.address && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{selectedCustomer.address}</dd>
              </div>
            )}
            {selectedCustomer.preferences && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Preferences</dt>
                <dd className="mt-1 text-sm text-gray-900">{selectedCustomer.preferences}</dd>
              </div>
            )}
            {selectedCustomer.birthDate && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Birth Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(selectedCustomer.birthDate).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
          <div className="mt-6 flex space-x-3">
            <Link
              to={`/customers/${selectedCustomer._id}/edit`}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Edit Customer
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Loyalty & Purchase Info</h2>
          <div className="mb-4">
            <span className="text-3xl font-bold text-blue-600">
              {selectedCustomer.loyaltyPoints}
            </span>
            <span className="ml-2 text-gray-600">points</span>
          </div>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Total Spent</dt>
              <dd className="text-sm font-medium text-gray-900">${totalSpent.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Total Orders</dt>
              <dd className="text-sm font-medium text-gray-900">{totalOrders}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Last Purchase</dt>
              <dd className="text-sm font-medium text-gray-900">
                {lastPurchaseAt ? new Date(lastPurchaseAt).toLocaleDateString() : 'Never'}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-gray-500">
            Earn 1 point per 100 MRU spent. 1 point = 1 MRU discount.
          </p>
          <div className="mt-4">
            <button
              onClick={() => setShowRedeemModal(true)}
              disabled={selectedCustomer.loyaltyPoints === 0}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              Redeem Points
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Loyalty History</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loyaltyHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No loyalty history
                  </td>
                </tr>
              ) : (
                loyaltyHistory.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          transaction.type === 'earn'
                            ? 'bg-green-100 text-green-800'
                            : transaction.type === 'redeem'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {transaction.type === 'earn' ? '+' : '-'}{transaction.points}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{transaction.description}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {loyaltyHistoryTotal > 10 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {loyaltyPage} of {Math.ceil(loyaltyHistoryTotal / 10)}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleLoyaltyPageChange(loyaltyPage - 1)}
                disabled={loyaltyPage === 1}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handleLoyaltyPageChange(loyaltyPage + 1)}
                disabled={loyaltyPage * 10 >= loyaltyHistoryTotal}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showRedeemModal && (
        <RedemptionModal
          customerId={selectedCustomer._id}
          customerName={`${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
          currentPoints={selectedCustomer.loyaltyPoints}
          orderId="temp-order-id"
          onClose={() => setShowRedeemModal(false)}
        />
      )}
    </div>
  );
}
