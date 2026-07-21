import { useEffect, useState } from 'react';
import { useMenuStore } from '../../../stores/menuStore';
import { useUIStore } from '../../../stores/uiStore';
import { CategoryDTO } from '../../../types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nContext';

export function CategoryListPage() {
  const { categories, fetchCategories, createCategory, updateCategory, deleteCategory } = useMenuStore();
  const { addToast } = useUIStore();
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDTO | null>(null);
  const [formData, setFormData] = useState({ name: '', sortOrder: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenModal = (category?: CategoryDTO) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, sortOrder: category.sortOrder });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', sortOrder: 0 });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', sortOrder: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory._id, formData);
        addToast('success', t('common.success'));
      } else {
        await createCategory(formData);
        addToast('success', t('common.success'));
      }
      handleCloseModal();
      fetchCategories();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('form.deleteCategoryConfirm'))) return;

    try {
      await deleteCategory(id);
      addToast('success', t('common.success'));
      fetchCategories();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    }
  };

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white text-surface-900">{t('menu.title')}</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-brand-500 text-white px-4 py-2 rounded-md hover:bg-brand-600"
        >
          <Plus size={20} />
          <span>{t('form.createCategory')}</span>
        </button>
      </div>

      <div className="card rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y dark:divide-white/5 divide-black/5">
          <thead className="dark:bg-white/5 bg-black/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                {t('common.name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                {t('form.sortOrder')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-surface-400 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-white/5 divide-black/5">
            {categories.map((category) => (
              <tr key={category._id} className="dark:hover:bg-white/5 hover:bg-black/5">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium dark:text-white text-surface-900">{category.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-surface-400">{category.sortOrder}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleOpenModal(category)}
                      className="text-brand-400 hover:text-brand-500"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="text-coral-400 hover:text-coral-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="dark:bg-surface-900 bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium dark:text-white text-surface-900 mb-4">
              {editingCategory ? t('form.editCategory') : t('form.createCategory')}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">{t('common.name')} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full border dark:border-white/10 border-black/10 dark:bg-surface-800 bg-surface-100 rounded-md px-3 py-2 dark:text-white text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">{t('form.sortOrder')}</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full border dark:border-white/10 border-black/10 dark:bg-surface-800 bg-surface-100 rounded-md px-3 py-2 dark:text-white text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border dark:border-white/10 border-black/10 rounded-md text-surface-300 dark:hover:bg-white/5 hover:bg-black/5"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50"
                >
                  {isLoading ? t('common.saving') : editingCategory ? t('common.save') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
