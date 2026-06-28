import { apiClient } from './api-client';
import { ApiResponse, OrderDTO, OrderItemDTO, CreateOrderInput, ProductDTO, CategoryDTO } from '../types';

export const orderService = {
  async createOrder(data: CreateOrderInput): Promise<{ orderId: string; orderNumber?: string; tableStatus: string; kitchenQueueId: string }> {
    const idempotencyKey = crypto.randomUUID();
    const response = await apiClient.post<ApiResponse<{ orderId: string; orderNumber?: string; tableStatus: string; kitchenQueueId: string }>>(
      '/orders',
      data,
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create order');
    }

    return response.data.data;
  },

  async getOrders(filters?: {
    status?: string;
    tableId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ orders: OrderDTO[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tableId) params.append('tableId', filters.tableId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<ApiResponse<OrderDTO[]>>(`/orders?${params.toString()}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get orders');
    }

    return {
      orders: response.data.data,
      total: response.data.meta?.total || 0,
    };
  },

  async getActiveOrders(): Promise<OrderDTO[]> {
    const response = await apiClient.get<ApiResponse<OrderDTO[]>>('/orders/active');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get active orders');
    }

    return response.data.data;
  },

  async getOrderById(id: string): Promise<{ order: OrderDTO; items: OrderItemDTO[] }> {
    const response = await apiClient.get<ApiResponse<{ order: OrderDTO; items: OrderItemDTO[] }>>(`/orders/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get order');
    }

    return response.data.data;
  },

  async updateOrderStatus(id: string, status: string): Promise<OrderDTO> {
    const response = await apiClient.patch<ApiResponse<OrderDTO>>(`/orders/${id}/status`, { status });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update order status');
    }

    return response.data.data;
  },

  async getProducts(filters?: {
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: ProductDTO[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<ApiResponse<ProductDTO[]>>(`/menu/products?${params.toString()}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get products');
    }

    return {
      products: response.data.data,
      total: response.data.meta?.total || 0,
    };
  },

  async getCategories(): Promise<CategoryDTO[]> {
    const response = await apiClient.get<ApiResponse<CategoryDTO[]>>('/menu/categories');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get categories');
    }

    return response.data.data;
  },

  async getProductsAvailability(): Promise<Record<string, { inStock: boolean; missingItems: string[] }>> {
    const response = await apiClient.get<ApiResponse<Record<string, { inStock: boolean; missingItems: string[] }>>>('/menu/products/availability');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get products availability');
    }

    return response.data.data;
  },
};
