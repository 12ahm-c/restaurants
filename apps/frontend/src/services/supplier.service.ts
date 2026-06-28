import { apiClient } from './api-client';

export interface Supplier {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  balanceDue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDebtMovement {
  _id: string;
  supplierId: string;
  type: 'purchase_debt' | 'payment' | 'adjustment';
  amount: number;
  previousBalance: number;
  newBalance: number;
  inventoryId?: string;
  stockMovementId?: string;
  description: string;
  createdAt: string;
}

export const supplierService = {
  async getSuppliers(search?: string): Promise<Supplier[]> {
    const response = await apiClient.get('/suppliers', {
      params: search ? { search } : undefined,
    });
    return response.data.data;
  },

  async createSupplier(data: { name: string; phone?: string; email?: string }): Promise<Supplier> {
    const response = await apiClient.post('/suppliers', data);
    return response.data.data;
  },

  async getSupplierMovements(id: string): Promise<SupplierDebtMovement[]> {
    const response = await apiClient.get(`/suppliers/${id}/movements`);
    return response.data.data;
  },
};
