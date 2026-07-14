import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { authService } from '../../../services/auth.service';
import { useUIStore } from '../../../stores/uiStore';
import { useI18n } from '../../../i18n/I18nContext';

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useUIStore();
  const { t, locale, setLocale } = useI18n();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatedUser = await authService.updateProfile({ name, phone, language: locale });
      updateUser(updatedUser);
      addToast('success', t('profile.updated'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('profile.updateFailed');
      addToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-display font-bold text-white mb-4">{t('profile.title')}</h1>

      <div className="max-w-lg space-y-4">
        <form onSubmit={handleSubmit} className="card rounded-2xl border border-white/5 shadow-card p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-surface-300 mb-1.5">{t('profile.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-300 mb-1.5">{t('profile.phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              placeholder={t('auth.phoneNumber')}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? t('profile.saving') : t('profile.saveChanges')}
            </button>
          </div>
        </form>

        {/* Language Selector */}
        <div className="card rounded-2xl border border-white/5 shadow-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-surface-300">{t('profile.language')}</h2>
          <div className="flex gap-2">
            {(['fr', 'en', 'ar'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                  locale === lang
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
                }`}
              >
                {t(`lang.${lang}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
