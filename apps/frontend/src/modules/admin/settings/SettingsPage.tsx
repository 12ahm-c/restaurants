import React, { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';
import { useI18n } from '../../../i18n/I18nContext';
import { authService } from '../../../services/auth.service';
import { TentPricing } from '../../../services/settings.service';

const DURATION_KEYS = [
  { key: 'per_hour', label: 'settings.tentPricing.perHour', labelAr: 'سعر الساعة' },
  { key: 'per_2hours', label: 'settings.tentPricing.per2Hours', labelAr: 'سعر ساعتين' },
  { key: 'per_3hours', label: 'settings.tentPricing.per3Hours', labelAr: 'سعر 3 ساعات' },
  { key: 'per_4hours', label: 'settings.tentPricing.per4Hours', labelAr: 'سعر 4 ساعات' },
  { key: 'per_5hours', label: 'settings.tentPricing.per5Hours', labelAr: 'سعر 5 ساعات' },
  { key: 'per_6hours', label: 'settings.tentPricing.per6Hours', labelAr: 'سعر 6 ساعات' },
  { key: 'per_8hours', label: 'settings.tentPricing.per8Hours', labelAr: 'سعر 8 ساعات' },
  { key: 'per_12hours', label: 'settings.tentPricing.per12Hours', labelAr: 'سعر 12 ساعة' },
] as const;

type DurationKey = typeof DURATION_KEYS[number]['key'];

export function SettingsPage() {
  const { settings, isLoading, isSaving, fetchSettings, updateSettings } = useSettingsStore();
  const { user, updateUser } = useAuthStore();
  const { addToast } = useUIStore();
  const { t } = useI18n();

  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(1);
  const [tentPricing, setTentPricing] = useState<Record<DurationKey, TentPricing>>({
    per_hour: { small: 0, medium: 0, large: 0 },
    per_2hours: { small: 0, medium: 0, large: 0 },
    per_3hours: { small: 0, medium: 0, large: 0 },
    per_4hours: { small: 0, medium: 0, large: 0 },
    per_5hours: { small: 0, medium: 0, large: 0 },
    per_6hours: { small: 0, medium: 0, large: 0 },
    per_8hours: { small: 0, medium: 0, large: 0 },
    per_12hours: { small: 0, medium: 0, large: 0 },
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name);
      setCurrency(settings.currency);
      setLoyaltyPoints(settings.loyalty_points_per_100_mru);
      setLogoPreview(settings.logo || '');
      if (settings.tent_pricing) {
        setTentPricing({
          per_hour: settings.tent_pricing.per_hour || { small: 0, medium: 0, large: 0 },
          per_2hours: settings.tent_pricing.per_2hours || { small: 0, medium: 0, large: 0 },
          per_3hours: settings.tent_pricing.per_3hours || { small: 0, medium: 0, large: 0 },
          per_4hours: settings.tent_pricing.per_4hours || { small: 0, medium: 0, large: 0 },
          per_5hours: settings.tent_pricing.per_5hours || { small: 0, medium: 0, large: 0 },
          per_6hours: settings.tent_pricing.per_6hours || { small: 0, medium: 0, large: 0 },
          per_8hours: settings.tent_pricing.per_8hours || { small: 0, medium: 0, large: 0 },
          per_12hours: settings.tent_pricing.per_12hours || { small: 0, medium: 0, large: 0 },
        });
      }
    }
  }, [settings]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  const handleTentPriceChange = (period: DurationKey, size: 'small' | 'medium' | 'large', value: string) => {
    const numValue = parseFloat(value) || 0;
    setTentPricing((prev) => ({
      ...prev,
      [period]: { ...prev[period], [size]: numValue },
    }));
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        company_name: companyName,
        currency,
        loyalty_points_per_100_mru: loyaltyPoints,
        tent_pricing: tentPricing as any,
      });
      addToast('success', t('settings.settingsSaved'));
    } catch {
      addToast('error', t('settings.settingsSaveError'));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('error', t('settings.logoSizeError'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      setIsSavingLogo(true);
      try {
        await updateSettings({ logo: base64 });
        addToast('success', t('settings.logoSaved'));
      } catch {
        addToast('error', t('settings.settingsSaveError'));
      } finally {
        setIsSavingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    setLogoPreview('');
    setIsSavingLogo(true);
    try {
      await updateSettings({ logo: '' });
      addToast('success', t('settings.logoRemoved'));
    } catch {
      addToast('error', t('settings.settingsSaveError'));
    } finally {
      setIsSavingLogo(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('error', t('settings.passwordMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      addToast('error', t('settings.passwordTooShort'));
      return;
    }
    setIsChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      addToast('success', t('settings.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast('error', err.message || t('settings.settingsSaveError'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updatedUser = await authService.updateProfile({ name: profileName, phone: profilePhone });
      updateUser(updatedUser);
      addToast('success', t('settings.profileUpdated'));
    } catch (err: any) {
      addToast('error', err.message || t('settings.settingsSaveError'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-8">
      <h1 className="text-xl font-display font-bold dark:text-white text-surface-900">{t('settings.title')}</h1>

      {/* Logo */}
      <div className="card rounded-2xl border dark:border-white/5 border-black/5 shadow-card p-5 space-y-4">
        <h2 className="text-lg font-semibold dark:text-white text-surface-900">{t('settings.restaurantLogo')}</h2>
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-xl border-2 border-dashed dark:border-white/10 border-black/10 flex items-center justify-center overflow-hidden dark:bg-surface-900 bg-white cursor-pointer hover:border-brand-300 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <svg className="w-8 h-8 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-brand-400 hover:text-brand-500"
              disabled={isSavingLogo}
            >
              {logoPreview ? t('settings.changeLogo') : t('settings.uploadLogo')}
            </button>
            {logoPreview && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="block text-sm font-medium text-coral-400 hover:text-coral-500"
                disabled={isSavingLogo}
              >
                {t('settings.removeLogo')}
              </button>
            )}
            <p className="text-xs text-surface-400">{t('settings.pngJpgUpTo2Mb')}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Profile */}
      <form onSubmit={handleSaveProfile} className="card rounded-2xl border dark:border-white/5 border-black/5 shadow-card p-5 space-y-4">
        <h2 className="text-lg font-semibold dark:text-white text-surface-900">{t('settings.yourProfile')}</h2>
        <div>
          <label className="block text-sm font-semibold text-surface-300 mb-1.5">{t('common.name')}</label>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-surface-300 mb-1.5">{t('common.phone')}</label>
          <input
            type="tel"
            value={profilePhone}
            onChange={(e) => setProfilePhone(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={isSavingProfile} className="btn-primary">
            {isSavingProfile ? t('common.saving') : t('settings.saveProfile')}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="card rounded-2xl border dark:border-white/5 border-black/5 shadow-card p-5 space-y-4">
        <h2 className="text-lg font-semibold dark:text-white text-surface-900">{t('settings.changePassword')}</h2>
        <div>
          <label className="block text-sm font-semibold text-surface-300 mb-1.5">{t('settings.currentPassword')}</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-surface-300 mb-1.5">{t('settings.newPassword')}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-field"
            minLength={6}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-surface-300 mb-1.5">{t('settings.confirmPassword')}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
            minLength={6}
            required
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={isChangingPassword} className="btn-primary">
            {isChangingPassword ? t('settings.changingPassword') : t('settings.changePasswordButton')}
          </button>
        </div>
      </form>

      {/* General Settings */}
      <form onSubmit={handleSaveGeneral} className="card rounded-2xl border dark:border-white/5 border-black/5 shadow-card p-5 space-y-4">
        <h2 className="text-lg font-semibold dark:text-white text-surface-900">{t('settings.restaurant')}</h2>
        <div>
          <label className="block text-sm font-semibold text-surface-300 mb-1.5">{t('settings.restaurantName')}</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-surface-300 mb-1.5">{t('settings.currency')}</label>
          <input
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-surface-300 mb-1.5">{t('settings.loyaltyPoints')}</label>
          <input
            type="number"
            value={loyaltyPoints}
            onChange={(e) => setLoyaltyPoints(parseFloat(e.target.value) || 0)}
            className="input-field"
            min="0"
            step="0.5"
          />
        </div>

        {/* Tent Pricing */}
        <div className="border-t dark:border-white/5 border-black/5 pt-4 mt-4">
          <h3 className="text-md font-semibold dark:text-white text-surface-900 mb-3">{t('settings.tentPricing.title')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-white/10 border-black/10">
                  <th className="text-left py-2 dark:text-surface-400 text-surface-500 font-medium">{t('settings.tentPricing.duration')}</th>
                  <th className="text-center py-2 dark:text-surface-400 text-surface-500 font-medium">{t('settings.tentPricing.small')}</th>
                  <th className="text-center py-2 dark:text-surface-400 text-surface-500 font-medium">{t('settings.tentPricing.medium')}</th>
                  <th className="text-center py-2 dark:text-surface-400 text-surface-500 font-medium">{t('settings.tentPricing.large')}</th>
                </tr>
              </thead>
              <tbody>
                {DURATION_KEYS.map(({ key, labelAr }) => (
                  <tr key={key} className="border-b dark:border-white/5 border-black/5">
                    <td className="py-2 dark:text-surface-300 text-surface-600 font-medium">{labelAr}</td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={tentPricing[key].small}
                        onChange={(e) => handleTentPriceChange(key, 'small', e.target.value)}
                        className="input-field text-center text-sm py-1.5"
                        min="0"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={tentPricing[key].medium}
                        onChange={(e) => handleTentPriceChange(key, 'medium', e.target.value)}
                        className="input-field text-center text-sm py-1.5"
                        min="0"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={tentPricing[key].large}
                        onChange={(e) => handleTentPriceChange(key, 'large', e.target.value)}
                        className="input-field text-center text-sm py-1.5"
                        min="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSaving} className="btn-primary">
            {isSaving ? t('common.saving') : t('settings.saveSettings')}
          </button>
        </div>
      </form>
    </div>
  );
}
