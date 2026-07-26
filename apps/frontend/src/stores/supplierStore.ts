import { create } from 'zustand';
import { supplierService, Supplier, SupplierDebtMovement } from '../services/supplier.service';

interface SupplierState {
  suppliers: Supplier[];
  selectedSupplierMovements: SupplierDebtMovement[];
  loading: boolean;
  error: string | null;
  fetchSuppliers: (search?: string) => Promise<void>;
  createSupplier: (data: { name: string; phone?: string; email?: string }) => Promise<Supplier>;
  fetchSupplierMovements: (id: string) => Promise<void>;
  clearMovements: () => void;
}

export const useSupplierStore = create<SupplierState>((set) => ({
  suppliers: [],
  selectedSupplierMovements: [],
  loading: false,
  error: null,

  fetchSuppliers: async (search?) => {
    set({ loading: true, error: null });
    try {
      const suppliers = await supplierService.getSuppliers(search);
      set({ suppliers, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch suppliers', loading: false });
    }
  },

  createSupplier: async (data) => {
    set({ loading: true, error: null });
    try {
      const supplier = await supplierService.createSupplier(data);
      set((state) => ({
        suppliers: [supplier, ...state.suppliers],
        loading: false,
      }));
      return supplier;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create supplier', loading: false });
      throw error;
    }
  },

  fetchSupplierMovements: async (id) => {
    try {
      const movements = await supplierService.getSupplierMovements(id);
      set({ selectedSupplierMovements: movements });
    } catch (error: any) {
      console.error('Failed to fetch supplier movements:', error);
      set({ selectedSupplierMovements: [] });
    }
  },

  clearMovements: () => set({ selectedSupplierMovements: [] }),
}));
