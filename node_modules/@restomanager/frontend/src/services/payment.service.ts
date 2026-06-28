import { apiClient } from './api-client';

export interface PaymentData {
  orderId: string;
  amount: number;
  method: 'cash' | 'card' | 'mobile';
  cashGiven?: number;
}

export interface PaymentResponse {
  paymentId: string;
  changeAmount: number;
  orderStatus: string;
  loyaltyPointsEarned: number;
}

export const paymentService = {
  async processPayment(data: PaymentData): Promise<PaymentResponse> {
    const response = await apiClient.post('/payments', data, {
      headers: { 'idempotency-key': `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` },
    });
    return response.data.data;
  },

  async getPaymentsByOrder(orderId: string): Promise<any[]> {
    const response = await apiClient.get(`/payments/order/${orderId}`);
    return response.data.data;
  },

  async refundPayment(paymentId: string): Promise<any> {
    const response = await apiClient.post(`/payments/${paymentId}/refund`);
    return response.data.data;
  },

  async getPayments(filters?: {
    method?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ payments: any[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.method) params.append('method', filters.method);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/payments?${params.toString()}`);
    return {
      payments: response.data.data || [],
      total: response.data.meta?.total || 0,
    };
  },
};
