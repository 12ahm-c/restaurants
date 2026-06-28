import { create } from 'zustand';
import { CartItem, OrderType, TableDTO } from '../types';

interface CartState {
  items: CartItem[];
  selectedTable: TableDTO | null;
  orderType: OrderType;
  customerId?: string;
  notes: string;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemNotes: (productId: string, notes: string) => void;
  setSelectedTable: (table: TableDTO | null) => void;
  setOrderType: (type: OrderType) => void;
  setCustomerId: (id: string | undefined) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  selectedTable: null,
  orderType: 'dine-in',
  customerId: undefined,
  notes: '',

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    }));
  },

  updateItemNotes: (productId, notes) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, notes } : i
      ),
    }));
  },

  setSelectedTable: (table) => set({ selectedTable: table }),
  setOrderType: (type) => set({ orderType: type }),
  setCustomerId: (id) => set({ customerId: id }),
  setNotes: (notes) => set({ notes }),

  clearCart: () =>
    set({
      items: [],
      selectedTable: null,
      orderType: 'dine-in',
      customerId: undefined,
      notes: '',
    }),

  getTotal: () => {
    return get().items.reduce((total, item) => {
      const optionsTotal = item.options?.reduce((sum, opt) => sum + opt.price, 0) || 0;
      return total + (item.price + optionsTotal) * item.quantity;
    }, 0);
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
