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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-900 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertCircle className="text-coral-400 mr-2" size={24} />
            <h3 className="text-lg font-medium text-white">Cancel Order</h3>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-300">
            <X size={24} />
          </button>
        </div>

        <p className="text-surface-400 mb-4">
          Are you sure you want to cancel order #{orderId.slice(-6).toUpperCase()}?
        </p>
        <p className="text-sm text-amber-400 mb-4">
          This will restore all inventory stock and free the table.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-surface-300 mb-1">
            Reason for cancellation *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Enter reason..."
            className="w-full border border-white/10 bg-surface-800 rounded-md px-3 py-2 text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-coral-400"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-white/10 rounded-md text-surface-300 hover:bg-white/5 disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading || !reason.trim()}
            className="px-4 py-2 bg-coral-500 text-white rounded-md hover:bg-coral-600 disabled:opacity-50"
          >
            {isLoading ? 'Cancelling...' : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
