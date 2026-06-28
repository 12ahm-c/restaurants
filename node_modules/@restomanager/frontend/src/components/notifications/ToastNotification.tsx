import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: string;
  entity?: string;
  entityId?: string;
}

interface ToastNotificationProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  const navigate = useNavigate();

  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, 5000);
      return () => clearTimeout(timer);
    });
  }, [toasts, onDismiss]);

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'order_ready':
        return 'bg-green-500';
      case 'stock_critical':
        return 'bg-red-500';
      case 'loyalty_earned':
        return 'bg-yellow-500';
      case 'payment_received':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleClick = (toast: Toast) => {
    if (toast.entity && toast.entityId) {
      switch (toast.entity) {
        case 'order':
          navigate('/orders/active');
          break;
        case 'inventory':
          navigate('/inventory');
          break;
        case 'customer':
          navigate(`/customers/${toast.entityId}`);
          break;
        default:
          break;
      }
    }
    onDismiss(toast.id);
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => handleClick(toast)}
          className={`${getTypeStyles(toast.type)} text-white px-4 py-3 rounded-lg shadow-lg cursor-pointer transform transition-all hover:scale-105 animate-slide-in`}
        >
          <div className="font-semibold">{toast.title}</div>
          <div className="text-sm opacity-90">{toast.message}</div>
        </div>
      ))}
    </div>
  );
};
