import React, { useState } from 'react';
import { usePaymentStore } from '../../stores/paymentStore';

interface PaymentProps {
  orderId: string;
  totalAmount: number;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

export const Payment: React.FC<PaymentProps> = ({ orderId, totalAmount, onSuccess, onCancel }) => {
  const [method, setMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [cashGiven, setCashGiven] = useState<string>('');
  const { processPayment, isProcessing, currentPayment, clearPayment } = usePaymentStore();

  const calculateChange = (): number => {
    if (method !== 'cash' || !cashGiven) return 0;
    return Math.max(0, parseFloat(cashGiven) - totalAmount);
  };

  const handleSubmit = async () => {
    if (method === 'cash' && (!cashGiven || parseFloat(cashGiven) < totalAmount)) {
      return;
    }

    await processPayment({
      orderId,
      amount: totalAmount,
      method,
      cashGiven: method === 'cash' ? parseFloat(cashGiven) : undefined,
    });
  };

  if (currentPayment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="dark:bg-surface-900 bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-brand-400">Payment Successful!</h2>
          <div className="space-y-3">
            {currentPayment.changeAmount > 0 && (
              <div className="bg-brand-500/10 p-4 rounded">
                <p className="text-sm text-surface-300">Change to give:</p>
                <p className="text-2xl font-bold text-brand-400">{currentPayment.changeAmount.toFixed(2)} MRU</p>
              </div>
            )}
            {currentPayment.loyaltyPointsEarned > 0 && (
              <div className="bg-surface-800 p-4 rounded">
                <p className="text-sm text-surface-300">Loyalty points earned:</p>
                <p className="text-lg font-bold text-brand-400">+{currentPayment.loyaltyPointsEarned} pts</p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              clearPayment();
              onSuccess(currentPayment.paymentId);
            }}
            className="w-full mt-4 bg-brand-500 text-white py-2 rounded hover:bg-brand-600"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="dark:bg-surface-900 bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 dark:text-white text-surface-900">Process Payment</h2>
        <div className="mb-4">
          <p className="text-surface-300">Total Amount:</p>
          <p className="text-2xl font-bold">{totalAmount.toFixed(2)} MRU</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-surface-300 mb-2">Payment Method</label>
          <div className="flex gap-2">
            {(['cash', 'card', 'mobile'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                  className={`flex-1 py-2 rounded border ${
                    method === m ? 'bg-brand-500 text-white' : 'dark:bg-surface-800 bg-surface-100 text-surface-300 dark:border-white/10 border-black/10'
                  }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {method === 'cash' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-surface-300 mb-2">Cash Given</label>
            <input
              type="number"
              value={cashGiven}
              onChange={(e) => setCashGiven(e.target.value)}
              min={totalAmount}
              step="0.01"
              className="w-full border dark:border-white/10 border-black/10 rounded px-3 py-2 dark:bg-surface-800 bg-surface-100 dark:text-white text-surface-900 placeholder-surface-400"
              placeholder="Enter amount"
            />
            {cashGiven && parseFloat(cashGiven) >= totalAmount && (
              <div className="mt-2 bg-brand-500/10 p-2 rounded">
                <p className="text-sm text-surface-300">Change: {calculateChange().toFixed(2)} MRU</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border dark:border-white/10 border-black/10 rounded dark:hover:bg-white/5 hover:bg-black/5 text-surface-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing || (method === 'cash' && (!cashGiven || parseFloat(cashGiven) < totalAmount))}
            className="flex-1 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};
