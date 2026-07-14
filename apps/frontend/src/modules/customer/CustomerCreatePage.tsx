import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../../stores/customerStore';

export function CustomerCreatePage() {
  const navigate = useNavigate();
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
      setError('Name and phone are required');
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
      setError(err.message || 'Failed to create customer');
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <button
          onClick={() => navigate('/customers')}
          className="text-brand-600 hover:text-brand-700 text-sm font-medium"
        >
          &larr; Back
        </button>
        <h1 className="mt-2 text-xl font-display font-bold text-gray-900">Add Customer</h1>
      </div>

      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl text-sm text-red-600">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="input-field"
                placeholder="Customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="Phone number"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Saving...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
