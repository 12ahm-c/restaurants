import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../../stores/customerStore';

export function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCustomer, loading, error, fetchCustomerById, updateCustomer, clearSelectedItem } = useCustomerStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    preferences: '',
    birthDate: '',
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
        lastName: selectedCustomer.lastName,
        phone: selectedCustomer.phone,
        email: selectedCustomer.email || '',
        address: selectedCustomer.address || '',
        preferences: selectedCustomer.preferences || '',
        birthDate: selectedCustomer.birthDate ? selectedCustomer.birthDate.split('T')[0] : '',
      });
    }
  }, [selectedCustomer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.firstName || !formData.lastName || !formData.phone) {
      setSubmitError('First name, last name, and phone are required');
      return;
    }

    try {
      await updateCustomer(id!, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address || undefined,
        preferences: formData.preferences || undefined,
        birthDate: formData.birthDate || undefined,
      });
      navigate(`/customers/${id}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to update customer');
    }
  };

  if (loading && !selectedCustomer) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>
        <button onClick={() => navigate('/customers')} className="mt-4 text-blue-600 hover:text-blue-800">
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button onClick={() => navigate(`/customers/${id}`)} className="text-blue-600 hover:text-blue-800">
          &larr; Back to Customer
        </button>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Customer</h1>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          {submitError && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{submitError}</div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferences</label>
              <textarea name="preferences" value={formData.preferences} onChange={handleChange} rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
              <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={() => navigate(`/customers/${id}`)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
