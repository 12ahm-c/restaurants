import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../../stores/settingsStore';

export function SettingsPage() {
  const { settings, fetchSettings, updateSettings, isLoading, isSaving, error } = useSettingsStore();
  const [formData, setFormData] = useState({
    loyalty_points_per_100_mru: 1,
    loyalty_redeem_rate: 1,
    taxRate: 0,
    currency: 'MRU',
    company_name: 'RestoManager',
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        loyalty_points_per_100_mru: settings.loyalty_points_per_100_mru,
        loyalty_redeem_rate: settings.loyalty_redeem_rate,
        taxRate: settings.taxRate,
        currency: settings.currency,
        company_name: settings.company_name,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    try {
      await updateSettings(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      // Error handled by store
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
          Settings saved successfully! Changes are now active across the app.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">This name appears in the navbar and exported reports.</p>
          </div>
        </div>

        {/* Financial */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
              <input
                type="number"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Loyalty */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Loyalty Program</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Points per 100 MRU</label>
              <input
                type="number"
                value={formData.loyalty_points_per_100_mru}
                onChange={(e) => setFormData({ ...formData, loyalty_points_per_100_mru: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.1"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Redeem Rate (1 point = X MRU)</label>
              <input
                type="number"
                value={formData.loyalty_redeem_rate}
                onChange={(e) => setFormData({ ...formData, loyalty_redeem_rate: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.1"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
