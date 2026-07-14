import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../../services/auth.service';
import { useUIStore } from '../../../stores/uiStore';
import { UserDTO } from '../../../types';
import { useI18n } from '../../../i18n/I18nContext';

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
  const { t } = useI18n();

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
      addToast('success', t('common.success'));
      navigate('/admin/employees');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      addToast('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const roleOptions = [
    { value: 'server', label: t('role.server') },
    { value: 'cashier', label: t('role.cashier') },
    { value: 'chef', label: t('role.chef') },
    { value: 'stock_manager', label: t('role.stock_manager') },
    { value: 'manager', label: t('role.manager') },
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
        <p className="text-gray-500">{t('form.employeeNotFound')}</p>
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
          &larr; {t('common.back')}
        </button>
        <h1 className="mt-2 text-xl font-display font-bold text-gray-900">{t('employees.edit')}</h1>
      </div>

      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('common.name')}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('common.phone')}</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              placeholder={t('form.phoneNumber')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('employees.role')}</label>
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
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">{t('form.active')}</label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('form.newPassword')} <span className="text-gray-400 font-normal">{t('form.passwordHint')}</span>
            </label>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder={t('form.newPassword')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/employees')}
              className="btn-secondary flex-1"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex-1"
            >
              {isSaving ? t('common.saving') : t('profile.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
