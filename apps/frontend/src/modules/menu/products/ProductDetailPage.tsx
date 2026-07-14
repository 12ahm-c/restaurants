import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { menuService, ProductWithRecipe } from '../../../services/menu.service';
import { useUIStore } from '../../../stores/uiStore';
import { useI18n } from '../../../i18n/I18nContext';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  unavailable: 'bg-yellow-100 text-yellow-800',
  discontinued: 'bg-red-100 text-red-800',
};

export function ProductDetailPage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [productData, setProductData] = useState<ProductWithRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    try {
      const data = await menuService.getProductById(id);
      setProductData(data);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await menuService.deleteProduct(id);
      addToast('success', t('common.success'));
      navigate('/menu/products');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    }
  };

  const handleStatusToggle = async () => {
    if (!id || !productData) return;
    const newStatus = productData.product.status === 'available' ? 'unavailable' : 'available';
    try {
      const updated = await menuService.updateProductStatus(id, newStatus);
      setProductData({ ...productData, product: updated });
      addToast('success', t('common.success'));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">{t('common.noData')}</p>
      </div>
    );
  }

  const { product, recipe } = productData;

  return (
    <div className="py-6">
      <div className="flex items-center mb-6">
        <Link to="/menu/products" className="text-gray-500 hover:text-gray-700 mr-4">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{product.name}</h1>
        <div className="flex space-x-2">
          {product.status !== 'discontinued' && (
            <>
              <button
                onClick={handleStatusToggle}
                className={`px-4 py-2 rounded-md ${
                  product.status === 'available'
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {product.status === 'available' ? t('form.markUnavailable') : t('form.markAvailable')}
              </button>
              <Link
                to={`/menu/products/${id}/edit`}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                <Edit size={18} />
                <span>{t('common.edit')}</span>
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                <Trash2 size={18} />
                <span>{t('common.delete')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {product.imageUrl && (
            <div className="mb-6">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}
          {!product.imageUrl && (
            <div className="mb-6 w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">{t('form.noImage')}</span>
            </div>
          )}
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('form.productDetails')}</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">{t('common.name')}</dt>
              <dd className="text-sm text-gray-900">{product.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">{t('menu.category')}</dt>
              <dd className="text-sm text-gray-900">
                {(product.categoryId as unknown as { name: string })?.name || 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">{t('menu.price')}</dt>
              <dd className="text-sm text-gray-900">{product.price} MRU</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">{t('form.prepTime')}</dt>
              <dd className="text-sm text-gray-900">{product.prepTime || 0} min</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-sm text-gray-500">{t('form.description')}</dt>
              <dd className="text-sm text-gray-900">{product.description || t('form.noDescription')}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">{t('menu.status')}</dt>
              <dd>
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    statusColors[product.status]
                  }`}
                >
                  {product.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('form.recipe')}</h2>
          {recipe.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('form.noRecipe')}</p>
          ) : (
            <ul className="space-y-3">
              {recipe.map((item, index) => (
                <li key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="text-gray-500">
                    {item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('menu.deleteTitle')}</h3>
            <p className="text-gray-500 mb-6">
              {t('form.deleteProductConfirm')} &quot;{product.name}&quot;?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
