import { create } from 'zustand';
import { CartItem, OrderType, TentDTO } from '../types';

interface CartState {
  items: CartItem[];
  selectedTent: TentDTO | null;
  orderType: OrderType;
  customerId?: string;
  notes: string;
  addItem: (item: CartItem) => void;
  setItems: (items: CartItem[]) => void;
  removeItem: (productId: string, quantityTypeName?: string) => void;
  updateQuantity: (productId: string, quantity: number, quantityTypeName?: string) => void;
  updateItemNotes: (productId: string, notes: string, quantityTypeName?: string) => void;
  setSelectedTent: (tent: TentDTO | null) => void;
  setOrderType: (type: OrderType) => void;
  setCustomerId: (id: string | undefined) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  selectedTent: null,
  orderType: 'dine-in',
  customerId: undefined,
  notes: '',

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId && i.quantityTypeName === item.quantityTypeName);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId && i.quantityTypeName === item.quantityTypeName
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
  },

  setItems: (items) => set({ items }),

  removeItem: (productId, quantityTypeName) => {
    set((state) => ({
      items: state.items.filter((i) => !(i.productId === productId && i.quantityTypeName === quantityTypeName)),
    }));
  },

  updateQuantity: (productId, quantity, quantityTypeName) => {
    if (quantity <= 0) {
      get().removeItem(productId, quantityTypeName);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId && i.quantityTypeName === quantityTypeName ? { ...i, quantity } : i
      ),
    }));
  },

  updateItemNotes: (productId, notes, quantityTypeName) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId && i.quantityTypeName === quantityTypeName ? { ...i, notes } : i
      ),
    }));
  },

  setSelectedTent: (tent) => set({ selectedTent: tent }),
  setOrderType: (type) => set({ orderType: type }),
  setCustomerId: (id) => set({ customerId: id }),
  setNotes: (notes) => set({ notes }),

  clearCart: () =>
    set({
      items: [],
      selectedTent: null,
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
