import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMenuStore } from '../../../stores/menuStore';
import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';
import { useI18n } from '../../../i18n/I18nContext';
import { Plus, Search, Edit, Trash2, Eye, Package, Filter, ToggleLeft, ToggleRight } from 'lucide-react';

export function ProductListPage() {
  const { products, categories, isLoading, fetchProducts, fetchCategories, deleteProduct, updateProductStatus, setFilters } = useMenuStore();
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const canEdit = user?.role === 'owner' || user?.role === 'manager';
  const canToggleStatus = canEdit || user?.role === 'chef';

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

  const handleToggleActive = async (productId: string, currentIsActive: boolean) => {
    try {
      await updateProductStatus(productId, currentIsActive ? 'unavailable' : 'available');
      addToast('success', t('common.success'));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    }
  };

  return (
    <div className="py-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold dark:text-white text-surface-900">{t('menu.title')}</h1>
          <p className="text-sm text-surface-400 mt-1">{products.length} {t('menu.title').toLowerCase()}</p>
        </div>
        {canEdit && (
          <Link
            to="/menu/products/new"
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus size={18} />
            {t('menu.add')}
          </Link>
        )}
      </div>

      {/* Search & Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-500" size={18} />
              <input
                type="text"
                placeholder={t('menu.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field pl-10"
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
              className="input-field"
            >
              <option value="">{t('menu.allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleSearch} className="btn-secondary flex items-center justify-center gap-2">
            <Filter size={16} />
            {t('common.search')}
          </button>
        </div>
      </div>

      {/* Products */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-surface-700 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-sm text-surface-400">{t('common.loading')}</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-surface-600" />
          </div>
          <p className="text-surface-400 font-medium">{t('menu.noProducts')}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Mobile: Card view */}
          <div className="md:hidden divide-y dark:divide-white/5 divide-black/5">
            {products.map((product) => (
              <div key={product._id} className="p-4 dark:hover:bg-white/5 hover:bg-black/5 transition-colors">
                <div className="flex items-start gap-3">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-surface-800 flex items-center justify-center">
                      <Package size={20} className="text-surface-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold dark:text-white text-surface-900 truncate">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-surface-500 truncate mt-0.5">{product.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {canToggleStatus ? (
                          <button
                            onClick={() => handleToggleActive(product._id, product.isActive)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
                              product.isActive
                                ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                                : 'bg-surface-800 text-surface-500 hover:bg-surface-700'
                            }`}
                            title={product.isActive ? t('menu.deactivate') : t('menu.activate')}
                          >
                            {product.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            <span className="text-[10px] font-semibold">{product.isActive ? t('menu.active') : t('menu.inactive')}</span>
                          </button>
                        ) : (
                          <span className={`badge text-[10px] ${product.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {product.isActive ? t('menu.active') : t('menu.inactive')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-brand-400">{product.price} MRU</span>
                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <Link to={`/menu/products/${product._id}`} className="p-1.5 rounded-lg dark:hover:bg-white/5 hover:bg-black/5 text-surface-400 dark:hover:text-white hover:text-surface-900 transition-colors">
                            <Eye size={16} />
                          </Link>
                          <Link to={`/menu/products/${product._id}/edit`} className="p-1.5 rounded-lg dark:hover:bg-white/5 hover:bg-black/5 text-surface-400 hover:text-amber-400 transition-colors">
                            <Edit size={16} />
                          </Link>
                          <button onClick={() => setShowDeleteModal(product._id)} className="p-1.5 rounded-lg dark:hover:bg-white/5 hover:bg-black/5 text-surface-400 hover:text-coral-400 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-white/5 border-black/5">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">{t('menu.product')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">{t('menu.category')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">{t('menu.price')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">{t('menu.status')}</th>
                  {canEdit && <th className="text-right px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/5 divide-black/5">
                {products.map((product) => (
                  <tr key={product._id} className="table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center">
                            <Package size={16} className="text-surface-600" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold dark:text-white text-surface-900">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-surface-500 truncate max-w-xs">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-surface-300">{(product.categoryId as unknown as { name: string })?.name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-brand-400">{product.price} MRU</span>
                    </td>
                    <td className="px-6 py-4">
                      {canToggleStatus ? (
                        <button
                          onClick={() => handleToggleActive(product._id, product.isActive)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                            product.isActive
                              ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                              : 'bg-surface-800 text-surface-500 hover:bg-surface-700'
                          }`}
                        >
                          {product.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          <span className="text-xs font-semibold">{product.isActive ? t('menu.active') : t('menu.inactive')}</span>
                        </button>
                      ) : (
                        <span className={`badge ${product.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {product.isActive ? t('menu.active') : t('menu.inactive')}
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/menu/products/${product._id}`} className="p-2 rounded-lg dark:hover:bg-white/5 hover:bg-black/5 text-surface-400 dark:hover:text-white hover:text-surface-900 transition-colors">
                            <Eye size={18} />
                          </Link>
                          <Link to={`/menu/products/${product._id}/edit`} className="p-2 rounded-lg dark:hover:bg-white/5 hover:bg-black/5 text-surface-400 hover:text-amber-400 transition-colors">
                            <Edit size={18} />
                          </Link>
                          <button onClick={() => setShowDeleteModal(product._id)} className="p-2 rounded-lg dark:hover:bg-white/5 hover:bg-black/5 text-surface-400 hover:text-coral-400 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="dark:bg-surface-900 bg-white border dark:border-white/5 border-black/5 rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="w-12 h-12 bg-coral-500/15 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-coral-400" />
            </div>
            <h3 className="text-lg font-display font-bold dark:text-white text-surface-900 text-center mb-2">{t('menu.deleteTitle')}</h3>
            <p className="text-surface-400 text-center mb-6">{t('menu.deleteConfirm')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="btn-secondary flex-1">
                {t('common.cancel')}
              </button>
              <button onClick={() => handleDelete(showDeleteModal)} className="btn-danger flex-1">
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
