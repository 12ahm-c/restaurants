import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../../stores/customerStore';
import { useI18n } from '../../i18n/I18nContext';

export function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { selectedCustomer, loading, error, fetchCustomerById, updateCustomer, clearSelectedItem } = useCustomerStore();
  const [formData, setFormData] = useState({
    firstName: '',
    phone: '',
  });
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (id) {
      fetchCustomerById(id);
    }
    return () => clearSelectedItem();
  }, [id]);

  useEffect(() => {
    if (selectedCustomer) {
      setFormData({
        firstName: selectedCustomer.firstName,
        phone: selectedCustomer.phone,
      });
    }
  }, [selectedCustomer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.firstName || !formData.phone) {
      setSubmitError(t('common.error'));
      return;
    }

    try {
      await updateCustomer(id!, {
        firstName: formData.firstName,
        lastName: selectedCustomer?.lastName || '',
        phone: formData.phone,
      });
      navigate(`/customers/${id}`);
    } catch (err: any) {
      setSubmitError(err.message || t('common.error'));
    }
  };

  if (loading && !selectedCustomer) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600">{error}</div>
        <button onClick={() => navigate('/customers')} className="mt-3 text-brand-600 text-sm font-medium">
          {t('form.backToCustomers')}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <button onClick={() => navigate(`/customers/${id}`)} className="text-brand-600 hover:text-brand-700 text-sm font-medium">
          &larr; {t('common.back')}
        </button>
        <h1 className="mt-2 text-xl font-display font-bold text-gray-900">{t('customers.edit')}</h1>
      </div>

      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl text-sm text-red-600">{submitError}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('common.name')}</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('common.phone')}</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                className="input-field" />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => navigate(`/customers/${id}`)}
              className="btn-secondary flex-1">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={loading}
              className="btn-primary flex-1">
              {loading ? t('common.saving') : t('profile.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
