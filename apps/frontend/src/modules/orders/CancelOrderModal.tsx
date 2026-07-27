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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 max-w-md w-full border border-black/10 dark:border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center">
            <AlertCircle className="text-coral-400 mr-2" size={24} />
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">Cancel Order</h3>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200">
            <X size={24} />
          </button>
        </div>

        <p className="text-surface-600 dark:text-surface-400 mb-2 text-sm">
          Are you sure you want to cancel order #{orderId.slice(-6).toUpperCase()}?
        </p>
        <p className="text-xs text-amber-500 mb-4 font-medium">
          This will free the table.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            Reason for cancellation *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Enter reason..."
            className="input-field"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary"
          >
            Keep Order
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading || !reason.trim()}
            className="btn-danger"
          >
            {isLoading ? 'Cancelling...' : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
