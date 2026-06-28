import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../../services/auth.service';
import { useUIStore } from '../../../stores/uiStore';
import { UserDTO } from '../../../types';

export function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<UserDTO | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
          setEmail(found.email);
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
      const updateData: { name?: string; email?: string; role?: string; isActive?: boolean; password?: string } = {
        name,
        email,
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Employee not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Employee</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Active
          </label>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            New Password (leave blank to keep current)
          </label>
          <input
            id="password"
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/employees')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
