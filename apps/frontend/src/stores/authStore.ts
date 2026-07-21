import { create } from 'zustand';
import { UserDTO } from '../types';
import { authService } from '../services/auth.service';
import { clearTokens, getAccessToken } from '../services/api-client';

interface AuthState {
  user: UserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<UserDTO>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (user: UserDTO) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: !!getAccessToken(),
  error: null,

  login: async (phone: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authService.login(phone, password);
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (user: UserDTO) => {
    set({ user });
  },

  clearError: () => {
    set({ error: null });
  },
}));
