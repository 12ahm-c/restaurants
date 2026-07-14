import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMenuStore } from '../../../stores/menuStore';
import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';
import { useI18n } from '../../../i18n/I18nContext';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  unavailable: 'bg-yellow-100 text-yellow-800',
  discontinued: 'bg-red-100 text-red-800',
};

export function ProductListPage() {
  const { products, categories, isLoading, fetchProducts, fetchCategories, deleteProduct, setFilters } = useMenuStore();
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const canEdit = user?.role === 'owner' || user?.role === 'manager';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleSearch = () => {
    const filters = {
      search: searchQuery.trim() || undefined,
      categoryId: selectedCategory || undefined,
      page: 1,
    };

    setFilters(filters);
    fetchProducts(filters);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      addToast('success', t('common.success'));
      setShowDeleteModal(null);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    }
  };

  const statusLabels: Record<string, string> = {
    available: t('menu.available'),
    unavailable: t('menu.unavailable'),
    discontinued: t('menu.discontinued'),
  };

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('menu.title')}</h1>
        {canEdit && (
          <Link
            to="/menu/products/new"
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            <Plus size={20} />
            <span>{t('menu.add')}</span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t('menu.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => {
                const categoryId = e.target.value || undefined;
                setSelectedCategory(e.target.value);
                setFilters({ categoryId, page: 1 });
                fetchProducts({ categoryId, page: 1 });
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t('menu.allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleSearch} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200">
            {t('common.search')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">{t('menu.noProducts')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('menu.product')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('menu.category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('menu.price')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('menu.status')}</th>
                {canEdit && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover mr-3" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-3">
                          <span className="text-gray-400 text-xs">N/A</span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        {product.description && <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(product.categoryId as unknown as { name: string })?.name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.price} MRU</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[product.status]}`}>
                      {statusLabels[product.status] || product.status}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link to={`/menu/products/${product._id}`} className="text-indigo-600 hover:text-indigo-900"><Eye size={18} /></Link>
                        <Link to={`/menu/products/${product._id}/edit`} className="text-yellow-600 hover:text-yellow-900"><Edit size={18} /></Link>
                        <button onClick={() => setShowDeleteModal(product._id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('menu.deleteTitle')}</h3>
            <p className="text-gray-500 mb-6">{t('menu.deleteConfirm')}</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDeleteModal(null)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={() => handleDelete(showDeleteModal)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
