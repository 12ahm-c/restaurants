import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../../services/auth.service';
import { useUIStore } from '../../../stores/uiStore';
import { UserDTO } from '../../../types';

export function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<UserDTO | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useUIStore();

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const { employees } = await authService.getEmployees(1, 100);
        const found = employees.find((e) => e._id === id);
        if (found) {
          setEmployee(found);
          setName(found.name);
          setPhone(found.phone || '');
          setRole(found.role);
          setIsActive(found.isActive);
        }
      } catch (error) {
        addToast('error', 'Failed to load employee');
        navigate('/admin/employees');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployee();
  }, [id, navigate, addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);

    try {
      const updateData: { name?: string; phone?: string; role?: string; isActive?: boolean; password?: string } = {
        name,
        phone,
        role,
        isActive,
      };

      if (password) {
        updateData.password = password;
      }

      await authService.updateEmployee(id, updateData);
      addToast('success', 'Employee updated successfully');
      navigate('/admin/employees');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update employee';
      addToast('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const roleOptions = [
    { value: 'server', label: 'Server' },
    { value: 'cashier', label: 'Cashier' },
    { value: 'chef', label: 'Chef' },
    { value: 'stock_manager', label: 'Stock Manager' },
    { value: 'manager', label: 'Manager' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Employee not found</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <button
          onClick={() => navigate('/admin/employees')}
          className="text-brand-600 hover:text-brand-700 text-sm font-medium"
        >
          &larr; Back
        </button>
        <h1 className="mt-2 text-xl font-display font-bold text-gray-900">Edit Employee</h1>
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

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              New Password <span className="text-gray-400 font-normal">(leave blank to keep)</span>
            </label>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="New password"
            />
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
              disabled={isSaving}
              className="btn-primary flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
