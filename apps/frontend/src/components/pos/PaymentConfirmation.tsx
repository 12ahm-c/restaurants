import React from 'react';

interface PaymentConfirmationProps {
  paymentId: string;
  changeAmount: number;
  loyaltyPointsEarned: number;
  onClose: () => void;
}

export const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  paymentId,
  changeAmount,
  loyaltyPointsEarned,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-green-600">Payment Successful!</h2>
          <p className="text-gray-500 text-sm mt-1">Transaction ID: {paymentId}</p>
        </div>

        <div className="space-y-3">
          {changeAmount > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Change to give:</p>
              <p className="text-2xl font-bold text-green-600">{changeAmount.toFixed(2)} MRU</p>
            </div>
          )}
          {loyaltyPointsEarned > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Loyalty points earned:</p>
              <p className="text-lg font-bold text-blue-600">+{loyaltyPointsEarned} pts</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
