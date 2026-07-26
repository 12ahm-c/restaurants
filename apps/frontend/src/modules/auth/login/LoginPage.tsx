import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { useI18n } from '../../../i18n/I18nContext';
import { getDefaultRouteForRole } from '../../../utils/defaultRoute';
import { Eye, EyeOff, ArrowRight, Shield, Zap, Clock } from 'lucide-react';

export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login(phone, password);
      navigate(getDefaultRouteForRole(user.role));
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-950">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-surface-900 via-surface-950 to-surface-950">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-brand-500/5 to-transparent rounded-full" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-8 shadow-lg shadow-brand-500/20 border border-white/10 bg-surface-900 flex items-center justify-center">
            <img src="/app-icon.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          
          <h1 className="text-5xl font-display font-bold mb-4 leading-tight text-white">
            RestoManager
          </h1>
          <p className="text-xl text-surface-400 mb-12 max-w-md leading-relaxed">
            Modern restaurant management system. Streamline orders, manage tables, and boost efficiency.
          </p>
          
          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="p-2.5 bg-brand-500/15 rounded-xl">
                <Zap size={20} className="text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Real-time Analytics</p>
                <p className="text-xs text-surface-500">Track sales, orders, and performance live</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="p-2.5 bg-accent-500/15 rounded-xl">
                <Shield size={20} className="text-accent-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Role-based Access</p>
                <p className="text-xs text-surface-500">Secure permissions for every team member</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="p-2.5 bg-amber-500/15 rounded-xl">
                <Clock size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">24/7 Support</p>
                <p className="text-xs text-surface-500">Always here to help you succeed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 dark:bg-surface-950 bg-surface-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-brand-500/20 border border-white/10 shrink-0 bg-surface-900 flex items-center justify-center">
              <img src="/app-icon.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-display font-bold dark:text-white text-surface-900">RestoManager</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold dark:text-white text-surface-900 mb-2">{t('auth.login')}</h2>
            <p className="text-surface-400">{t('auth.phoneNumber')}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-coral-500/10 border border-coral-500/20 rounded-xl flex items-center gap-3 animate-scale-in">
                <div className="w-2 h-2 bg-coral-500 rounded-full" />
                <p className="text-sm text-coral-400 flex-1">{error}</p>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-coral-400/60 hover:text-coral-400 transition-colors"
                >
                  ×
                </button>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-semibold text-surface-300">
                {t('auth.phoneNumber')}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                placeholder={t('auth.phoneNumber')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-surface-300">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder={t('auth.password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-surface-500 hover:text-surface-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth.loginButton')}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-surface-600">
            Restaurant Management System
          </p>
        </div>
      </div>
    </div>
  );
}
