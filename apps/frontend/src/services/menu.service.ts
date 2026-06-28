import { apiClient } from './api-client';
import { ApiResponse, ProductDTO, CategoryDTO } from '../types';

export interface RecipeItem {
  inventoryId: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface ProductWithRecipe {
  product: ProductDTO;
  recipe: RecipeItem[];
}

export const menuService = {
  async getProducts(filters?: {
    categoryId?: string;
    status?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ products: ProductDTO[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<ApiResponse<ProductDTO[]>>(
      `/menu/products?${params.toString()}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get products');
    }

    return {
      products: response.data.data,
      total: response.data.meta?.total || 0,
    };
  },

  async getProductById(id: string): Promise<ProductWithRecipe> {
    const response = await apiClient.get<ApiResponse<ProductWithRecipe>>(
      `/menu/products/${id}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get product');
    }

    return response.data.data;
  },

  async getCategories(): Promise<CategoryDTO[]> {
    const response = await apiClient.get<ApiResponse<CategoryDTO[]>>('/menu/categories');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get categories');
    }

    return response.data.data;
  },

  async createCategory(data: { name: string; sortOrder?: number }): Promise<CategoryDTO> {
    const response = await apiClient.post<ApiResponse<CategoryDTO>>('/menu/categories', data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create category');
    }

    return response.data.data;
  },

  async updateCategory(id: string, data: { name?: string; sortOrder?: number }): Promise<CategoryDTO> {
    const response = await apiClient.put<ApiResponse<CategoryDTO>>(`/menu/categories/${id}`, data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update category');
    }

    return response.data.data;
  },

  async deleteCategory(id: string): Promise<void> {
    const response = await apiClient.delete(`/menu/categories/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to delete category');
    }
  },

  async createProduct(data: {
    name: string;
    description?: string;
    categoryId: string;
    price: number;
    prepTime?: number;
    imageUrl?: string;
    recipe?: Array<{ inventoryId: string; quantity: number }>;
  }): Promise<ProductDTO> {
    const response = await apiClient.post<ApiResponse<ProductDTO>>('/menu/products', data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create product');
    }

    return response.data.data;
  },

  async updateProduct(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      categoryId: string;
      price: number;
      prepTime: number;
      status: string;
      imageUrl: string;
      recipe: Array<{ inventoryId: string; quantity: number }>;
    }>
  ): Promise<ProductDTO> {
    const response = await apiClient.put<ApiResponse<ProductDTO>>(`/menu/products/${id}`, data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update product');
    }

    return response.data.data;
  },

  async updateProductStatus(id: string, status: string): Promise<ProductDTO> {
    const response = await apiClient.patch<ApiResponse<ProductDTO>>(
      `/menu/products/${id}/status`,
      { status }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update product status');
    }

    return response.data.data;
  },

  async deleteProduct(id: string): Promise<void> {
    const response = await apiClient.delete(`/menu/products/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to delete product');
    }
  },

  async uploadProductImage(id: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post<ApiResponse<{ imageUrl: string }>>(
      `/upload/product-image/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to upload image');
    }

    return response.data.data.imageUrl;
  },
};
