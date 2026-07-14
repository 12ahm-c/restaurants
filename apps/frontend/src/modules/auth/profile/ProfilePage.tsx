import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { authService } from '../../../services/auth.service';
import { useUIStore } from '../../../stores/uiStore';

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useUIStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('fr');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setLanguage(user.language);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatedUser = await authService.updateProfile({ name, phone, language });
      updateUser(updatedUser);
      addToast('success', 'Profile updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
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
      <h1 className="text-xl font-display font-bold text-gray-900 mb-4">Profile</h1>

      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              placeholder="Your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input-field"
            >
              <option value="fr">Francais</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
