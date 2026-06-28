import { apiClient, setTokens, clearTokens } from './api-client';
import { AuthResponse, TokenResponse, UserDTO, ApiResponse } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Login failed');
    }

    const data = response.data.data;
    setTokens(data.accessToken, data.refreshToken);

    return data;
  },

  async refreshToken(token: string): Promise<TokenResponse> {
    const response = await apiClient.post<ApiResponse<TokenResponse>>('/auth/refresh', {
      refreshToken: token,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Refresh failed');
    }

    const data = response.data.data;
    setTokens(data.accessToken, data.refreshToken);

    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  async getMe(): Promise<UserDTO> {
    const response = await apiClient.get<ApiResponse<UserDTO>>('/auth/me');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get user');
    }

    return response.data.data;
  },

  async updateProfile(data: { name?: string; email?: string; language?: string }): Promise<UserDTO> {
    const response = await apiClient.patch<ApiResponse<UserDTO>>('/users/me', data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update profile');
    }

    return response.data.data;
  },

  async getEmployees(
    page: number = 1,
    limit: number = 20,
    filters?: { isActive?: boolean; role?: string }
  ): Promise<{ employees: UserDTO[]; total: number }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.role) params.append('role', filters.role);

    const response = await apiClient.get<ApiResponse<UserDTO[]>>(`/admin/employees?${params.toString()}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get employees');
    }

    return {
      employees: response.data.data,
      total: response.data.meta?.total || 0,
    };
  },

  async createEmployee(data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<UserDTO> {
    const response = await apiClient.post<ApiResponse<UserDTO>>('/admin/employees', data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create employee');
    }

    return response.data.data;
  },

  async updateEmployee(
    id: string,
    data: { name?: string; email?: string; role?: string; isActive?: boolean; password?: string }
  ): Promise<UserDTO> {
    const response = await apiClient.patch<ApiResponse<UserDTO>>(`/admin/employees/${id}`, data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update employee');
    }

    return response.data.data;
  },
};
