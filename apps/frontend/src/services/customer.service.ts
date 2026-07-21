import { apiClient } from './api-client';

export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  preferences?: string;
  loyaltyPoints: number;
  birthDate?: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  _id: string;
  customerId: string;
  type: 'earn' | 'redeem' | 'adjustment';
  points: number;
  orderId?: string;
  description: string;
  userId: string;
  timestamp: string;
}

export interface CustomerFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerResponse {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export interface CustomerPurchaseHistory {
  orders: Order[];
  total: number;
}

export const customerService = {
  async getCustomers(filters?: CustomerFilters): Promise<CustomerResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get(`/customers?${params.toString()}`);
    const items = response.data.data || [];
    const meta = response.data.meta || {};
    return {
      items,
      total: meta.total || items.length || 0,
      page: meta.page || filters?.page || 1,
      limit: meta.limit || filters?.limit || 20,
    };
  },

  async getCustomerById(id: string): Promise<{
    customer: Customer;
    totalSpent: number;
    lastPurchaseAt: string | null;
    totalOrders: number;
  }> {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data.data;
  },

  async searchCustomers(query: string): Promise<Customer[]> {
    const response = await apiClient.get(`/customers/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
  },

  async createCustomer(data: {
    firstName: string;
    lastName?: string;
    phone: string;
    email?: string;
    address?: string;
    preferences?: string;
    birthDate?: string;
    branchId?: string;
  }): Promise<Customer> {
    const payload: Record<string, string> = {
      firstName: data.firstName,
      phone: data.phone,
    };
    if (data.lastName) payload.lastName = data.lastName;
    if (data.email) payload.email = data.email;
    if (data.address) payload.address = data.address;
    if (data.preferences) payload.preferences = data.preferences;
    if (data.birthDate) payload.birthDate = data.birthDate;
    if (data.branchId) payload.branchId = data.branchId;

    const response = await apiClient.post('/customers', payload);
    return response.data.data;
  },

  async updateCustomer(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      address?: string;
      preferences?: string;
      birthDate?: string;
    }
  ): Promise<Customer> {
    const response = await apiClient.patch(`/customers/${id}`, data);
    return response.data.data;
  },

  async redeemLoyaltyPoints(
    customerId: string,
    points: number,
    orderId: string
  ): Promise<{ transaction: LoyaltyTransaction; customer: Customer }> {
    const response = await apiClient.post(`/customers/${customerId}/loyalty/redeem`, {
      points,
      orderId,
    });
    return response.data.data;
  },

  async getCustomerLoyaltyHistory(
    customerId: string,
    page?: number,
    limit?: number
  ): Promise<{ transactions: LoyaltyTransaction[]; total: number }> {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const response = await apiClient.get(`/customers/${customerId}/loyalty/history?${params.toString()}`);
    return response.data.data;
  },

  async getCustomerPurchaseHistory(
    customerId: string,
    page?: number,
    limit?: number
  ): Promise<CustomerPurchaseHistory> {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const response = await apiClient.get(`/customers/${customerId}/purchase-history?${params.toString()}`);
    return response.data.data;
  },

  async getLoyaltyRanking(limit?: number): Promise<Customer[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get(`/customers/loyalty/ranking${params}`);
    return response.data.data;
  },
};
