import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface UIState {
  sidebarOpen: boolean;
  toasts: Toast[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toasts: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  addToast: (type, message) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
