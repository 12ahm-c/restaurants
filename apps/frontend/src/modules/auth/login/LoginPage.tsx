import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { Utensils, Eye, EyeOff, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(phone, password);
      navigate('/dashboard');
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-orange-700">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-white/5 to-transparent rounded-full" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
            <Utensils size={32} />
          </div>
          <h1 className="text-5xl font-display font-bold mb-4 leading-tight">
            RestoManager
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-md">
            Modern restaurant management system. Streamline orders, manage tables, and boost efficiency.
          </p>
          <div className="flex gap-8">
            <div>
              <p className="text-3xl font-bold">50+</p>
              <p className="text-white/60 text-sm">Features</p>
            </div>
            <div>
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-white/60 text-sm">Support</p>
            </div>
            <div>
              <p className="text-3xl font-bold">99%</p>
              <p className="text-white/60 text-sm">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Utensils size={24} className="text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-gray-900">RestoManager</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500">Sign in to your account to continue</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-scale-in">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <p className="text-sm text-red-600 flex-1">{error}</p>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-red-400 hover:text-red-600"
                >
                  x
                </button>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                Phone number
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
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
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
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
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
                  Sign in
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Restaurant Management System
          </p>
        </div>
      </div>
    </div>
  );
}
