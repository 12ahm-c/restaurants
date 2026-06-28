import { create } from 'zustand';
import { paymentService, PaymentData } from '../services/payment.service';

interface PaymentState {
  currentPayment: {
    paymentId: string;
    changeAmount: number;
    orderStatus: string;
    loyaltyPointsEarned: number;
  } | null;
  isProcessing: boolean;
  error: string | null;

  processPayment: (data: PaymentData) => Promise<void>;
  clearPayment: () => void;
  clearError: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  currentPayment: null,
  isProcessing: false,
  error: null,

  processPayment: async (data: PaymentData) => {
    set({ isProcessing: true, error: null });
    try {
      const result = await paymentService.processPayment(data);
      set({ currentPayment: result, isProcessing: false });
    } catch (error: any) {
      set({ error: error.message || 'Payment failed', isProcessing: false });
      throw error;
    }
  },

  clearPayment: () => set({ currentPayment: null }),
  clearError: () => set({ error: null }),
}));
