import { apiClient } from './api-client';

export interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  threshold: number;
  unitPrice: number;
  supplier?: string;
  supplierId?: string;
  expiryDate?: string;
  branchId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  _id: string;
  inventoryId: string;
  type: 'adjustment' | 'replenishment' | 'deduction' | 'waste';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  userId: string;
  supplierId?: string;
  unitPrice?: number;
  paidSupplierPrice?: number;
  timestamp: string;
}

export interface InventoryAlert extends InventoryItem {
  alertType: 'critical' | 'low';
  shortage: number;
}

export interface StockValue {
  totalItems: number;
  totalValue: number;
  belowThreshold: number;
}

export interface InventoryFilters {
  branchId?: string;
  category?: string;
  belowThreshold?: string;
  search?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const inventoryService = {
  async getInventory(filters?: InventoryFilters): Promise<{
    items: InventoryItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get(`/inventory?${params.toString()}`);
    const items = response.data.data || [];
    const meta = response.data.meta || {};
    return {
      items,
      total: meta.total || items.length || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
    };
  },

  async getInventoryById(id: string): Promise<InventoryItem> {
    const response = await apiClient.get(`/inventory/${id}`);
    return response.data.data;
  },

  async createInventory(data: {
    name: string;
    category: string;
    unit: string;
    quantity: number;
    threshold: number;
    unitPrice: number;
    supplier?: string;
    supplierId?: string;
    expiryDate?: string;
  }): Promise<InventoryItem> {
    const response = await apiClient.post('/inventory', data);
    return response.data.data;
  },

  async adjustStock(
    id: string,
    data: { quantity: number; type: string; reason: string }
  ): Promise<{ item: InventoryItem; movement: StockMovement }> {
    const response = await apiClient.patch(`/inventory/${id}/adjust`, data);
    return response.data.data;
  },

  async incrementStock(
    id: string,
    data: {
      quantity: number;
      unitPrice?: number;
      supplier?: string;
      supplierId?: string;
      paidSupplierPrice?: number;
    }
  ): Promise<{ item: InventoryItem; movement: StockMovement }> {
    const response = await apiClient.patch(`/inventory/${id}/increment`, data);
    return response.data.data;
  },

  async getStockAlerts(branchId?: string): Promise<InventoryAlert[]> {
    const params = branchId ? `?branchId=${branchId}` : '';
    const response = await apiClient.get(`/inventory/alerts${params}`);
    return response.data.data;
  },

  async getStockValue(branchId?: string): Promise<StockValue> {
    const params = branchId ? `?branchId=${branchId}` : '';
    const response = await apiClient.get(`/inventory/stock-value${params}`);
    return response.data.data;
  },

  async getStockMovements(
    id: string,
    page?: number,
    limit?: number
  ): Promise<{ movements: StockMovement[]; total: number }> {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const response = await apiClient.get(`/inventory/${id}/movements?${params.toString()}`);
    return { movements: response.data.data || [], total: response.data.meta?.total || 0 };
  },
};
