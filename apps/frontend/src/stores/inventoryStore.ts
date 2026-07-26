import { create } from 'zustand';
import {
  inventoryService,
  InventoryItem,
  InventoryAlert,
  StockValue,
  InventoryFilters,
} from '../services/inventory.service';

interface InventoryState {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  alerts: InventoryAlert[];
  stockValue: StockValue | null;
  loading: boolean;
  error: string | null;
  filters: InventoryFilters;
  fetchInventory: (filters?: InventoryFilters) => Promise<void>;
  createItem: (data: {
    name: string;
    category: string;
    unit: string;
    quantity: number;
    threshold: number;
    unitPrice: number;
    supplier?: string;
    supplierId?: string;
    expiryDate?: string;
  }) => Promise<InventoryItem>;
  adjustStock: (
    id: string,
    data: { quantity: number; type: string; reason: string }
  ) => Promise<void>;
  incrementStock: (
    id: string,
    data: {
      quantity: number;
      unitPrice?: number;
      supplier?: string;
      supplierId?: string;
      paidSupplierPrice?: number;
    }
  ) => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchStockValue: () => Promise<void>;
  setFilters: (filters: InventoryFilters) => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  alerts: [],
  stockValue: null,
  loading: false,
  error: null,
  filters: {},

  fetchInventory: async (filters?) => {
    set({ loading: true, error: null });
    try {
      const result = await inventoryService.getInventory(filters || get().filters);
      set({
        items: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch inventory', loading: false });
    }
  },

  createItem: async (data) => {
    set({ loading: true, error: null });
    try {
      const item = await inventoryService.createInventory(data);
      set((state) => ({
        items: [item, ...state.items],
        total: state.total + 1,
        loading: false,
      }));
      return item;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create item', loading: false });
      throw error;
    }
  },

  adjustStock: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const result = await inventoryService.adjustStock(id, data);
      set((state) => ({
        items: state.items.map((i) => (i._id === id ? result.item : i)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to adjust stock', loading: false });
      throw error;
    }
  },

  incrementStock: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const result = await inventoryService.incrementStock(id, data);
      set((state) => ({
        items: state.items.map((i) => (i._id === id ? result.item : i)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to increment stock', loading: false });
      throw error;
    }
  },

  fetchAlerts: async () => {
    try {
      const alerts = await inventoryService.getStockAlerts();
      set({ alerts });
    } catch (error: any) {
      console.error('Failed to fetch alerts:', error);
    }
  },

  fetchStockValue: async () => {
    try {
      const stockValue = await inventoryService.getStockValue();
      set({ stockValue });
    } catch (error: any) {
      console.error('Failed to fetch stock value:', error);
    }
  },

  setFilters: (filters) => set({ filters }),
}));
