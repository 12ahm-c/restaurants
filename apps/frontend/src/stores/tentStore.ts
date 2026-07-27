import { create } from 'zustand';
import { TentDTO, TentStatusSummary, TentSize } from '../types';
import { apiClient } from '../services/api-client';

interface TentState {
  tents: TentDTO[];
  selectedTent: TentDTO | null;
  statusSummary: TentStatusSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchTents: (filters?: { status?: string; size?: string }) => Promise<void>;
  fetchTentStatusSummary: () => Promise<void>;
  setSelectedTent: (tent: TentDTO | null) => void;
  updateTentStatus: (id: string, status: string) => Promise<void>;
  markTentEmpty: (id: string) => Promise<void>;
  createTent: (data: { tentNumber: number; size: TentSize; position: { x: number; y: number } }) => Promise<TentDTO>;
}

export const useTentStore = create<TentState>((set, get) => ({
  tents: [],
  selectedTent: null,
  statusSummary: null,
  isLoading: false,
  error: null,

  fetchTents: async (filters) => {
    if (get().tents.length === 0) {
      set({ isLoading: true, error: null });
    } else {
      set({ error: null });
    }
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.size) params.append('size', filters.size);

      const response = await apiClient.get(`/tents?${params.toString()}`);
      set({ tents: response.data.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch tents', isLoading: false });
    }
  },

  fetchTentStatusSummary: async () => {
    try {
      const response = await apiClient.get('/tents/status');
      set({ statusSummary: response.data.data });
    } catch (error) {
      console.error('Failed to fetch tent status:', error);
    }
  },

  setSelectedTent: (tent) => set({ selectedTent: tent }),

  updateTentStatus: async (id, status) => {
    try {
      const response = await apiClient.patch(`/tents/${id}/status`, { status });
      set((state) => ({
        tents: state.tents.map((t) => (t._id === id ? response.data.data : t)),
      }));
    } catch (error) {
      set({ error: 'Failed to update tent status' });
    }
  },

  markTentEmpty: async (id) => {
    try {
      const response = await apiClient.patch(`/tents/${id}/empty`);
      set((state) => ({
        tents: state.tents.map((t) => (t._id === id ? response.data.data : t)),
      }));
    } catch (error) {
      set({ error: 'Failed to mark tent as empty' });
    }
  },

  createTent: async (data) => {
    const response = await apiClient.post('/tents', data);
    const tent = response.data.data;
    set((state) => ({ tents: [...state.tents, tent] }));
    return tent;
  },
}));
