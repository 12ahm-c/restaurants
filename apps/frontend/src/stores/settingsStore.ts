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
    if (!settings?.tent_pricing) return 0;

    const durationMap: Record<string, keyof typeof settings.tent_pricing> = {
      '1h': 'per_hour',
      '2h': 'per_2hours',
      '3h': 'per_3hours',
      '4h': 'per_4hours',
      '5h': 'per_5hours',
      '6h': 'per_6hours',
      '8h': 'per_8hours',
      '12h': 'per_12hours',
    };

    const period = durationMap[duration] || 'per_hour';
    return settings.tent_pricing[period]?.[tentSize] || 0;
  },
}));
