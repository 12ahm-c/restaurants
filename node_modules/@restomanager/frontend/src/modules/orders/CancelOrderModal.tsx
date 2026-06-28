import { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { kitchenService } from '../../services/kitchen.service';
import { AlertCircle, X } from 'lucide-react';

interface CancelOrderModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelOrderModal({ orderId, isOpen, onClose, onSuccess }: CancelOrderModalProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useUIStore();

  if (!isOpen) return null;

  const handleCancel = async () => {
    if (!reason.trim()) {
      addToast('error', 'Please provide a reason for cancellation');
      return;
    }

    setIsLoading(true);
    try {
      await kitchenService.cancelOrder(orderId, reason);
      addToast('success', 'Order cancelled successfully. Stock has been restored.');
      onSuccess();
      onClose();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to cancel order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-2" size={24} />
            <h3 className="text-lg font-medium text-gray-900">Cancel Order</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <p className="text-gray-500 mb-4">
          Are you sure you want to cancel order #{orderId.slice(-6).toUpperCase()}?
        </p>
        <p className="text-sm text-yellow-600 mb-4">
          This will restore all inventory stock and free the table.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for cancellation *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Enter reason..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading || !reason.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Cancelling...' : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
