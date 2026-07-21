import { apiClient } from './api-client';
import { ApiResponse } from '../types';

export interface KitchenQueueItem {
  _id: string;
  orderId: string;
  status: 'pending' | 'preparing' | 'ready';
  priority: number;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
  order?: {
    _id: string;
    orderNumber: string;
    type: string;
    status: string;
    totalTTC: number;
    notes?: string;
    createdAt: string;
  };
  table?: {
    _id: string;
    tentNumber: number;
    size: string;
  };
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    notes?: string;
  }>;
}

export const kitchenService = {
  async getQueue(filters?: {
    status?: string;
    priority?: number;
  }): Promise<KitchenQueueItem[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority !== undefined) params.append('priority', filters.priority.toString());

    const response = await apiClient.get<ApiResponse<KitchenQueueItem[]>>(
      `/kitchen/queue?${params.toString()}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get kitchen queue');
    }

    return response.data.data;
  },

  async getPriorityQueue(): Promise<KitchenQueueItem[]> {
    const response = await apiClient.get<ApiResponse<KitchenQueueItem[]>>('/kitchen/queue/priority');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get priority queue');
    }

    return response.data.data;
  },

  async startPreparation(id: string): Promise<KitchenQueueItem> {
    const response = await apiClient.patch<ApiResponse<KitchenQueueItem>>(
      `/kitchen/queue/${id}/start`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to start preparation');
    }

    return response.data.data;
  },

  async markReady(id: string): Promise<KitchenQueueItem> {
    const response = await apiClient.patch<ApiResponse<KitchenQueueItem>>(
      `/kitchen/queue/${id}/ready`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to mark as ready');
    }

    return response.data.data;
  },

  async cancelOrder(id: string, reason: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/orders/${id}/cancel`,
      { reason }
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to cancel order');
    }
  },
};
