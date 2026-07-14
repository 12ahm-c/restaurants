import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../../stores/customerStore';
import { useI18n } from '../../i18n/I18nContext';

export function CustomerCreatePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { createCustomer, loading } = useCustomerStore();
  const [formData, setFormData] = useState({
    firstName: '',
    phone: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.phone) {
      setError(t('common.error'));
      return;
    }

    try {
      await createCustomer({
        firstName: formData.firstName,
        lastName: '',
        phone: formData.phone,
      });
      navigate('/customers');
    } catch (err: any) {
      setError(err.message || t('common.error'));
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <button
          onClick={() => navigate('/customers')}
          className="text-brand-600 hover:text-brand-700 text-sm font-medium"
        >
          &larr; {t('common.back')}
        </button>
        <h1 className="mt-2 text-xl font-display font-bold text-gray-900">{t('customers.add')}</h1>
      </div>

      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl text-sm text-red-600">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t('common.name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="input-field"
                placeholder={t('customers.name')}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t('common.phone')} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder={t('common.phone')}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="btn-secondary flex-1"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? t('common.saving') : t('customers.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
