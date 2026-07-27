import { create } from 'zustand';
import { customerService, Customer, CustomerFilters } from '../services/customer.service';

interface CustomerState {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  selectedCustomer: Customer | null;
  totalSpent: number;
  lastPurchaseAt: string | null;
  totalOrders: number;
  searchResults: Customer[];
  loading: boolean;
  error: string | null;
  filters: CustomerFilters;
  fetchCustomers: (filters?: CustomerFilters) => Promise<void>;
  fetchCustomerById: (id: string) => Promise<void>;
  searchCustomers: (query: string) => Promise<void>;
  createCustomer: (data: {
    firstName: string;
    lastName?: string;
    phone: string;
    email?: string;
    address?: string;
    preferences?: string;
    birthDate?: string;
    branchId?: string;
    debt?: number;
  }) => Promise<Customer>;
  updateCustomer: (
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      address?: string;
      preferences?: string;
      birthDate?: string;
      debt?: number;
    }
  ) => Promise<void>;
  setFilters: (filters: CustomerFilters) => void;
  clearSelectedItem: () => void;
  clearSearchResults: () => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  total: 0,
  page: 1,
  limit: 20,
  selectedCustomer: null,
  totalSpent: 0,
  lastPurchaseAt: null,
  totalOrders: 0,
  searchResults: [],
  loading: false,
  error: null,
  filters: {},

  fetchCustomers: async (filters?) => {
    if (get().customers.length === 0) {
      set({ loading: true, error: null });
    } else {
      set({ error: null });
    }
    try {
      const result = await customerService.getCustomers(filters);
      set({
        customers: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch customers', loading: false });
    }
  },

  fetchCustomerById: async (id) => {
    set({ loading: true, error: null });
    try {
      const result = await customerService.getCustomerById(id);
      set({
        selectedCustomer: result.customer,
        totalSpent: result.totalSpent || 0,
        lastPurchaseAt: result.lastPurchaseAt || null,
        totalOrders: result.totalOrders || 0,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch customer', loading: false });
    }
  },

  searchCustomers: async (query) => {
    try {
      const results = await customerService.searchCustomers(query);
      set({ searchResults: results || [], loading: false });
    } catch (error: any) {
      console.error('Customer search failed:', error);
      set({ searchResults: [], loading: false });
    }
  },

  createCustomer: async (data) => {
    set({ loading: true, error: null });
    try {
      const customer = await customerService.createCustomer(data);
      set((state) => ({
        customers: [customer, ...state.customers],
        total: state.total + 1,
        loading: false,
      }));
      return customer;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create customer', loading: false });
      throw error;
    }
  },

  updateCustomer: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const customer = await customerService.updateCustomer(id, data);
      set((state) => ({
        customers: state.customers.map((c) => (c._id === id ? customer : c)),
        selectedCustomer: state.selectedCustomer?._id === id ? customer : state.selectedCustomer,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update customer', loading: false });
      throw error;
    }
  },

  setFilters: (filters) => set({ filters }),
  clearSelectedItem: () => set({ selectedCustomer: null }),
  clearSearchResults: () => set({ searchResults: [] }),
}));
