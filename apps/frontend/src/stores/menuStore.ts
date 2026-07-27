import { create } from 'zustand';
import { menuService } from '../services/menu.service';
import { ProductDTO, CategoryDTO } from '../types';

type MenuFilters = {
  categoryId?: string;
  status?: string;
  search?: string;
  page?: number;
};

function cleanFilters(filters: MenuFilters): MenuFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return value !== undefined && value !== null;
    })
  ) as MenuFilters;
}

interface MenuState {
  products: ProductDTO[];
  categories: CategoryDTO[];
  isLoading: boolean;
  error: string | null;
  filters: MenuFilters;
  pagination: {
    total: number;
    page: number;
    hasMore: boolean;
  };
  fetchProducts: (filters?: MenuFilters) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createProduct: (data: Record<string, unknown>) => Promise<ProductDTO>;
  updateProduct: (id: string, data: Record<string, unknown>) => Promise<ProductDTO>;
  deleteProduct: (id: string) => Promise<void>;
  updateProductStatus: (id: string, status: string) => Promise<ProductDTO>;
  createCategory: (data: Record<string, unknown>) => Promise<CategoryDTO>;
  updateCategory: (id: string, data: Record<string, unknown>) => Promise<CategoryDTO>;
  deleteCategory: (id: string) => Promise<void>;
  setFilters: (filters: MenuFilters) => void;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    total: 0,
    page: 1,
    hasMore: false,
  },

  fetchProducts: async (filters) => {
    if (get().products.length === 0) {
      set({ isLoading: true, error: null });
    } else {
      set({ error: null });
    }
    try {
      const currentFilters = cleanFilters({ ...get().filters, ...filters });
      const { products, total } = await menuService.getProducts(currentFilters);
      set({
        products,
        isLoading: false,
        filters: currentFilters,
        pagination: {
          total,
          page: currentFilters.page || 1,
          hasMore: (currentFilters.page || 1) * 20 < total,
        },
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        isLoading: false,
      });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await menuService.getCategories();
      set({ categories });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  },

  createProduct: async (data) => {
    const product = await menuService.createProduct(data as Parameters<typeof menuService.createProduct>[0]);
    set((state) => ({ products: [...state.products, product] }));
    return product;
  },

  updateProduct: async (id, data) => {
    const product = await menuService.updateProduct(id, data as Parameters<typeof menuService.updateProduct>[1]);
    set((state) => ({
      products: state.products.map((p) => (p._id === id ? product : p)),
    }));
    return product;
  },

  deleteProduct: async (id) => {
    await menuService.deleteProduct(id);
    set((state) => ({
      products: state.products.filter((p) => p._id !== id),
    }));
  },

  updateProductStatus: async (id, status) => {
    const targetStatus = status;
    const targetIsActive = status === 'available';
    const previousProducts = get().products;

    // Optimistic update for instant UI feedback
    set((state) => ({
      products: state.products.map((p) =>
        p._id === id ? { ...p, status: targetStatus as any, isActive: targetIsActive } : p
      ),
    }));

    try {
      const product = await menuService.updateProductStatus(id, status);
      set((state) => ({
        products: state.products.map((p) => (p._id === id ? product : p)),
      }));
      return product;
    } catch (error) {
      // Revert optimistic update if API fails
      set({ products: previousProducts });
      throw error;
    }
  },

  createCategory: async (data) => {
    const category = await menuService.createCategory(data as Parameters<typeof menuService.createCategory>[0]);
    set((state) => ({ categories: [...state.categories, category] }));
    return category;
  },

  updateCategory: async (id, data) => {
    const category = await menuService.updateCategory(id, data as Parameters<typeof menuService.updateCategory>[1]);
    set((state) => ({
      categories: state.categories.map((c) => (c._id === id ? category : c)),
    }));
    return category;
  },

  deleteCategory: async (id) => {
    await menuService.deleteCategory(id);
    set((state) => ({
      categories: state.categories.filter((c) => c._id !== id),
    }));
  },

  setFilters: (filters) => {
    set({ filters: cleanFilters({ ...get().filters, ...filters }) });
  },
}));
