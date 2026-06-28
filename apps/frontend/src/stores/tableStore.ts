import { create } from 'zustand';
import { TableDTO, TableStatusSummary } from '../types';
import { apiClient } from '../services/api-client';

interface TableState {
  tables: TableDTO[];
  selectedTable: TableDTO | null;
  statusSummary: TableStatusSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchTables: (filters?: { status?: string; zone?: string }) => Promise<void>;
  fetchTableStatusSummary: () => Promise<void>;
  setSelectedTable: (table: TableDTO | null) => void;
  updateTableStatus: (id: string, status: string) => Promise<void>;
  clearTable: (id: string) => Promise<void>;
  createTable: (data: { name: string; capacity: number; zone: string; position: { x: number; y: number } }) => Promise<TableDTO>;
}

export const useTableStore = create<TableState>((set) => ({
  tables: [],
  selectedTable: null,
  statusSummary: null,
  isLoading: false,
  error: null,

  fetchTables: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.zone) params.append('zone', filters.zone);

      const response = await apiClient.get(`/tables?${params.toString()}`);
      set({ tables: response.data.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch tables', isLoading: false });
    }
  },

  fetchTableStatusSummary: async () => {
    try {
      const response = await apiClient.get('/tables/status');
      set({ statusSummary: response.data.data });
    } catch (error) {
      console.error('Failed to fetch table status:', error);
    }
  },

  setSelectedTable: (table) => set({ selectedTable: table }),

  updateTableStatus: async (id, status) => {
    try {
      const response = await apiClient.patch(`/tables/${id}/status`, { status });
      set((state) => ({
        tables: state.tables.map((t) => (t._id === id ? response.data.data : t)),
      }));
    } catch (error) {
      set({ error: 'Failed to update table status' });
    }
  },

  clearTable: async (id) => {
    try {
      const response = await apiClient.patch(`/tables/${id}/clear`);
      set((state) => ({
        tables: state.tables.map((t) => (t._id === id ? response.data.data : t)),
      }));
    } catch (error) {
      set({ error: 'Failed to clear table' });
    }
  },

  createTable: async (data) => {
    const response = await apiClient.post('/tables', data);
    const table = response.data.data;
    set((state) => ({ tables: [...state.tables, table] }));
    return table;
  },
}));
