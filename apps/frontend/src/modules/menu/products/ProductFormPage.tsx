import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMenuStore } from '../../../stores/menuStore';
import { useUIStore } from '../../../stores/uiStore';
import { useI18n } from '../../../i18n/I18nContext';
import { ArrowLeft, Plus, X } from 'lucide-react';

interface FormData {
  name: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  price: number;
  prepTime: number;
  recipe: Array<{ inventoryId: string; quantity: number }>;
}

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories, fetchCategories, createProduct, updateProduct, createCategory } = useMenuStore();
  const { addToast } = useUIStore();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    imageUrl: '',
    categoryId: '',
    price: 0,
    prepTime: 15,
    recipe: [],
  });

  useEffect(() => {
    fetchCategories();
    if (id) {
      loadProduct();
    }
  }, [id, fetchCategories]);

  const loadProduct = async () => {
    if (!id) return;
    try {
      const { menuService } = await import('../../../services/menu.service');
      const data = await menuService.getProductById(id);
      setFormData({
        name: data.product.name,
        description: data.product.description || '',
        imageUrl: data.product.imageUrl || '',
        categoryId: (data.product.categoryId as unknown as { _id: string })?._id || '',
        price: data.product.price,
        prepTime: data.product.prepTime || 15,
        recipe: data.recipe.map((item) => ({
          inventoryId: item.inventoryId,
          quantity: item.quantity,
        })),
      });
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'prepTime' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleRecipeChange = (index: number, field: string, value: string | number) => {
    setFormData((prev) => {
      const newRecipe = [...prev.recipe];
      newRecipe[index] = {
        ...newRecipe[index],
        [field]: field === 'quantity' ? parseFloat(value as string) || 0 : value,
      };
      return { ...prev, recipe: newRecipe };
    });
  };

  const addRecipeItem = () => {
    setFormData((prev) => ({
      ...prev,
      recipe: [...prev.recipe, { inventoryId: '', quantity: 0 }],
    }));
  };

  const removeRecipeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      recipe: prev.recipe.filter((_, i) => i !== index),
    }));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsCreatingCategory(true);
    try {
      const cat = await createCategory({ name: newCategoryName.trim() });
      setFormData((prev) => ({ ...prev, categoryId: cat._id }));
      setShowCategoryModal(false);
      setNewCategoryName('');
      addToast('success', t('common.success'));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        categoryId: formData.categoryId,
        price: formData.price,
      };
      if (formData.description) payload.description = formData.description;
      if (formData.imageUrl) payload.imageUrl = formData.imageUrl;
      if (formData.prepTime) payload.prepTime = formData.prepTime;
      if (formData.recipe.length > 0) payload.recipe = formData.recipe;

      if (id) {
        await updateProduct(id, payload);
        addToast('success', t('common.success'));
      } else {
        await createProduct(payload as unknown as Record<string, unknown>);
        addToast('success', t('common.success'));
      }
      navigate('/menu/products');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="flex items-center mb-6">
        <Link to="/menu/products" className="text-surface-400 hover:text-surface-300 mr-4">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-white">
          {id ? t('form.editProduct') : t('form.createProduct')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">{t('common.name')} *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-white/10 bg-surface-800 rounded-md px-3 py-2 text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">{t('form.description')}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-white/10 bg-surface-800 rounded-md px-3 py-2 text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">{t('form.imageUrl')}</label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full border border-white/10 bg-surface-800 rounded-md px-3 py-2 text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="https://example.com/image.jpg"
            />
            {formData.imageUrl && (
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="mt-2 h-32 w-32 object-cover rounded-lg"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">{t('form.category')} *</label>
              <div className="flex space-x-2">
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="flex-1 border border-white/10 bg-surface-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">{t('form.selectCategory')}</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="px-3 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 flex items-center"
                  title="Add new category"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">{t('form.price')} *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full border border-white/10 bg-surface-800 rounded-md px-3 py-2 text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">{t('form.prepTime')}</label>
            <input
              type="number"
              name="prepTime"
              value={formData.prepTime}
              onChange={handleChange}
              min="0"
              className="w-full border border-white/10 bg-surface-800 rounded-md px-3 py-2 text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-surface-300">{t('form.recipe')}</label>
              <button
                type="button"
                onClick={addRecipeItem}
                className="text-sm text-brand-400 hover:text-brand-500"
              >
                + {t('form.addIngredient')}
              </button>
            </div>
            {formData.recipe.length === 0 ? (
              <p className="text-sm text-surface-400">{t('form.noIngredients')}</p>
            ) : (
              <div className="space-y-2">
                {formData.recipe.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder={t('form.inventoryId')}
                      value={item.inventoryId}
                      onChange={(e) => handleRecipeChange(index, 'inventoryId', e.target.value)}
                      className="flex-1 border border-white/10 bg-surface-800 rounded-md px-3 py-2 text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <input
                      type="number"
                      placeholder={t('form.qty')}
                      value={item.quantity}
                      onChange={(e) => handleRecipeChange(index, 'quantity', e.target.value)}
                      min="0.01"
                      step="0.01"
                      className="w-24 border border-white/10 bg-surface-800 rounded-md px-3 py-2 text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeRecipeItem(index)}
                      className="text-coral-400 hover:text-coral-500"
                    >
                      {t('form.remove')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Link
            to="/menu/products"
                  className="px-4 py-2 border border-white/10 rounded-md text-surface-300 hover:bg-white/5"
          >
            {t('common.cancel')}
          </Link>
          <button
            type="submit"
            disabled={isLoading}
                  className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50"
          >
            {isLoading ? t('common.saving') : id ? t('form.editProduct') : t('form.createProduct')}
          </button>
        </div>
      </form>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-900 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">{t('form.createCategory')}</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-surface-400 hover:text-surface-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div className="mb-4">
            <label className="block text-sm font-medium text-surface-300 mb-1">{t('common.name')} *</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                  autoFocus
                  className="w-full border border-white/10 bg-surface-800 rounded-md px-3 py-2 text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder={t('form.categoryName')}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
            className="px-4 py-2 border border-white/10 rounded-md text-surface-300 hover:bg-white/5"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCategory || !newCategoryName.trim()}
            className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50"
                >
                  {isCreatingCategory ? t('common.loading') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
