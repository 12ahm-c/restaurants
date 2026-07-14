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
      if (id) {
        await updateProduct(id, formData as unknown as Record<string, unknown>);
        addToast('success', t('common.success'));
      } else {
        await createProduct(formData as unknown as Record<string, unknown>);
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
        <Link to="/menu/products" className="text-gray-500 hover:text-gray-700 mr-4">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? t('form.editProduct') : t('form.createProduct')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.name')} *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.description')}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.imageUrl')}</label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.category')} *</label>
              <div className="flex space-x-2">
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                  title="Add new category"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.price')} *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.prepTime')}</label>
            <input
              type="number"
              name="prepTime"
              value={formData.prepTime}
              onChange={handleChange}
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">{t('form.recipe')}</label>
              <button
                type="button"
                onClick={addRecipeItem}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                + {t('form.addIngredient')}
              </button>
            </div>
            {formData.recipe.length === 0 ? (
              <p className="text-sm text-gray-500">{t('form.noIngredients')}</p>
            ) : (
              <div className="space-y-2">
                {formData.recipe.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder={t('form.inventoryId')}
                      value={item.inventoryId}
                      onChange={(e) => handleRecipeChange(index, 'inventoryId', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      placeholder={t('form.qty')}
                      value={item.quantity}
                      onChange={(e) => handleRecipeChange(index, 'quantity', e.target.value)}
                      min="0.01"
                      step="0.01"
                      className="w-24 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeRecipeItem(index)}
                      className="text-red-600 hover:text-red-800"
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
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {t('common.cancel')}
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? t('common.saving') : id ? t('form.editProduct') : t('form.createProduct')}
          </button>
        </div>
      </form>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{t('form.createCategory')}</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.name')} *</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                  autoFocus
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('form.categoryName')}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
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
