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
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-green-600">Payment Successful!</h2>
          <div className="space-y-3">
            {currentPayment.changeAmount > 0 && (
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600">Change to give:</p>
                <p className="text-2xl font-bold text-green-600">{currentPayment.changeAmount.toFixed(2)} MRU</p>
              </div>
            )}
            {currentPayment.loyaltyPointsEarned > 0 && (
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600">Loyalty points earned:</p>
                <p className="text-lg font-bold text-blue-600">+{currentPayment.loyaltyPointsEarned} pts</p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              clearPayment();
              onSuccess(currentPayment.paymentId);
            }}
            className="w-full mt-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Process Payment</h2>
        <div className="mb-4">
          <p className="text-gray-600">Total Amount:</p>
          <p className="text-2xl font-bold">{totalAmount.toFixed(2)} MRU</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <div className="flex gap-2">
            {(['cash', 'card', 'mobile'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`flex-1 py-2 rounded border ${
                  method === m ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {method === 'cash' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cash Given</label>
            <input
              type="number"
              value={cashGiven}
              onChange={(e) => setCashGiven(e.target.value)}
              min={totalAmount}
              step="0.01"
              className="w-full border rounded px-3 py-2"
              placeholder="Enter amount"
            />
            {cashGiven && parseFloat(cashGiven) >= totalAmount && (
              <div className="mt-2 bg-green-50 p-2 rounded">
                <p className="text-sm text-gray-600">Change: {calculateChange().toFixed(2)} MRU</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing || (method === 'cash' && (!cashGiven || parseFloat(cashGiven) < totalAmount))}
            className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};
