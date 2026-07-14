import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/auth.service';
import { useUIStore } from '../../../stores/uiStore';

export function EmployeeCreatePage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('server');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.createEmployee({ name, phone, password, role });
      addToast('success', 'Employee created successfully');
      navigate('/admin/employees');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create employee';
      addToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'server', label: 'Server' },
    { value: 'cashier', label: 'Cashier' },
    { value: 'chef', label: 'Chef' },
    { value: 'stock_manager', label: 'Stock Manager' },
    { value: 'manager', label: 'Manager' },
  ];

  return (
    <div className="p-4">
      <div className="mb-4">
        <button
          onClick={() => navigate('/admin/employees')}
          className="text-brand-600 hover:text-brand-700 text-sm font-medium"
        >
          &larr; Back
        </button>
        <h1 className="mt-2 text-xl font-display font-bold text-gray-900">Add Employee</h1>
      </div>

      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              placeholder="Phone number (used for login)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-field"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/employees')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
