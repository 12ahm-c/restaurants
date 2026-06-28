import { useState } from 'react';
import { useCustomerStore } from '../../stores/customerStore';

interface RedemptionModalProps {
  customerId: string;
  customerName: string;
  currentPoints: number;
  orderId: string;
  onClose: () => void;
}

export function RedemptionModal({ customerId, customerName, currentPoints, orderId, onClose }: RedemptionModalProps) {
  const { redeemLoyaltyPoints, loading } = useCustomerStore();
  const [points, setPoints] = useState('');
  const [error, setError] = useState('');

  const pointsToRedeem = parseInt(points, 10) || 0;
  const discountAmount = pointsToRedeem; // 1 point = 1 MRU
  const remainingPoints = currentPoints - pointsToRedeem;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pointsToRedeem || pointsToRedeem <= 0) {
      setError('Points must be positive');
      return;
    }

    if (pointsToRedeem > currentPoints) {
      setError('Insufficient points');
      return;
    }

    try {
      await redeemLoyaltyPoints(customerId, pointsToRedeem, orderId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to redeem points');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Redeem Loyalty Points</h2>
        <p className="mb-4 text-sm text-gray-600">Customer: {customerName}</p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Available Points</label>
            <div className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
              {currentPoints} points
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Points to Redeem</label>
            <input
              type="number"
              min="1"
              max={currentPoints}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter points to redeem"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount</label>
            <div className="rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
              {discountAmount} MRU
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Points</label>
            <div className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
              {remainingPoints >= 0 ? remainingPoints : 0} points
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || pointsToRedeem <= 0 || pointsToRedeem > currentPoints}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Redeeming...' : 'Redeem Points'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
