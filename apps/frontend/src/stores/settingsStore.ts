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
  getCompanyName: () => string;
  getLogo: () => string;
  getTentPrice: (tentSize: 'small' | 'medium' | 'large', duration: string) => number;
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

  getCompanyName: () => get().settings?.company_name || 'RestoManager',
  getLogo: () => get().settings?.logo || '',
  getTentPrice: (tentSize, duration) => {
    const settings = get().settings;
    if (!settings?.tent_price_per_hour) return 0;

    const hourlyPrice = settings.tent_price_per_hour[tentSize] || 0;
    const hours = parseInt(duration.replace('h', ''), 10) || 1;

    return hourlyPrice * hours;
  },
}));
