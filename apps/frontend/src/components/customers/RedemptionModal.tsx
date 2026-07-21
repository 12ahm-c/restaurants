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
      <div className="w-full max-w-md rounded-lg dark:bg-surface-900 bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold dark:text-white text-surface-900">Redeem Loyalty Points</h2>
        <p className="mb-4 text-sm text-surface-300">Customer: {customerName}</p>

        {error && (
          <div className="mb-4 rounded-md bg-coral-500/10 p-3 text-sm text-coral-400">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-surface-300 mb-1">Available Points</label>
            <div className="rounded-md bg-surface-800 px-3 py-2 text-sm font-medium text-surface-300">
              {currentPoints} points
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-surface-300 mb-1">Points to Redeem</label>
            <input
              type="number"
              min="1"
              max={currentPoints}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full rounded-md border dark:border-white/10 border-black/10 dark:bg-surface-800 bg-surface-100 px-3 py-2 dark:text-white text-surface-900 placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Enter points to redeem"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-surface-300 mb-1">Discount Amount</label>
            <div className="rounded-md bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-400">
              {discountAmount} MRU
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-surface-300 mb-1">Remaining Points</label>
            <div className="rounded-md bg-surface-800 px-3 py-2 text-sm font-medium text-brand-400">
              {remainingPoints >= 0 ? remainingPoints : 0} points
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border dark:border-white/10 border-black/10 dark:bg-surface-800 bg-surface-100 px-4 py-2 text-sm font-medium text-surface-300 dark:hover:bg-white/5 hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || pointsToRedeem <= 0 || pointsToRedeem > currentPoints}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? 'Redeeming...' : 'Redeem Points'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
