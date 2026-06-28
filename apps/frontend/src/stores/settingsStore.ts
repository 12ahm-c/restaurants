import { create } from 'zustand';
import { settingsService, Settings } from '../services/settings.service';

type SettingsListener = (settings: Settings) => void;

let listeners: SettingsListener[] = [];

export function onSettingsChange(listener: SettingsListener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notifyListeners(settings: Settings) {
  listeners.forEach((l) => l(settings));
}

interface SettingsState {
  settings: Settings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
  getTaxRate: () => number;
  getLoyaltyRate: () => number;
  getCompanyName: () => string;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await settingsService.getSettings();
      set({ settings, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch settings', isLoading: false });
    }
  },

  updateSettings: async (data: Partial<Settings>) => {
    set({ isSaving: true, error: null });
    try {
      const settings = await settingsService.updateSettings(data);
      set({ settings, isSaving: false });
      notifyListeners(settings);
    } catch (error: any) {
      set({ error: error.message || 'Failed to update settings', isSaving: false });
      throw error;
    }
  },

  getTaxRate: () => get().settings?.taxRate || 0,
  getLoyaltyRate: () => get().settings?.loyalty_points_per_100_mru || 1,
  getCompanyName: () => get().settings?.company_name || 'RestoManager',
}));
