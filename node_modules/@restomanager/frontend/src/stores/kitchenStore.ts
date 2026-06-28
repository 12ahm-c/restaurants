import { create } from 'zustand';
import { kitchenService, KitchenQueueItem } from '../services/kitchen.service';

interface KitchenState {
  queue: KitchenQueueItem[];
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    priority?: number;
  };
  fetchQueue: (filters?: { status?: string; priority?: number }) => Promise<void>;
  startPreparation: (id: string) => Promise<void>;
  markReady: (id: string) => Promise<void>;
  updateFromSocket: (event: string, data: unknown) => void;
  pendingCount: () => number;
  preparingCount: () => number;
  readyCount: () => number;
}

export const useKitchenStore = create<KitchenState>((set, get) => ({
  queue: [],
  isLoading: false,
  error: null,
  filters: {},

  fetchQueue: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const data = await kitchenService.getQueue(filters);
      set({ queue: data, isLoading: false, filters: filters || {} });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch queue',
        isLoading: false,
      });
    }
  },

  startPreparation: async (id) => {
    try {
      await kitchenService.startPreparation(id);
      set((state) => ({
        queue: state.queue.map((item) =>
          item._id === id
            ? { ...item, status: 'preparing' as const, startTime: new Date().toISOString() }
            : item
        ),
      }));
    } catch (error) {
      throw error;
    }
  },

  markReady: async (id) => {
    try {
      await kitchenService.markReady(id);
      set((state) => ({
        queue: state.queue.filter((item) => item._id !== id),
      }));
    } catch (error) {
      throw error;
    }
  },

  updateFromSocket: (event, data) => {
    if (event === 'order:new') {
      const newOrder = data as KitchenQueueItem;
      set((state) => ({
        queue: [newOrder, ...state.queue],
      }));
    } else if (event === 'order:status-update') {
      const update = data as { orderId: string; status: string };
      if (update.status === 'ready') {
        set((state) => ({
          queue: state.queue.filter((item) => item.orderId !== update.orderId),
        }));
      } else {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.orderId === update.orderId
              ? { ...item, status: update.status as KitchenQueueItem['status'] }
              : item
          ),
        }));
      }
    } else if (event === 'order:cancelled') {
      const cancel = data as { orderId: string };
      set((state) => ({
        queue: state.queue.filter((item) => item.orderId !== cancel.orderId),
      }));
    }
  },

  pendingCount: () => get().queue.filter((item) => item.status === 'pending').length,
  preparingCount: () => get().queue.filter((item) => item.status === 'preparing').length,
  readyCount: () => get().queue.filter((item) => item.status === 'ready').length,
}));
