import { useEffect, useState } from 'react';
import { useSupplierStore } from '../../stores/supplierStore';
import { useUIStore } from '../../stores/uiStore';
import { useI18n } from '../../i18n/I18nContext';
import {
  Truck, Plus, Search, X, ChevronDown, ChevronUp,
  DollarSign, Phone, Mail, ArrowDownCircle, ArrowUpCircle
} from 'lucide-react';

export function SuppliersPage() {
  const {
    suppliers, selectedSupplierMovements, loading, error,
    fetchSuppliers, createSupplier, fetchSupplierMovements, clearMovements,
  } = useSupplierStore();
  const { addToast } = useUIStore();
  const { t } = useI18n();

  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers(search || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createSupplier({
        name: createForm.name,
        phone: createForm.phone || undefined,
        email: createForm.email || undefined,
      });
      setShowCreateModal(false);
      setCreateForm({ name: '', phone: '', email: '' });
      addToast('success', t('common.success'));
    } catch {
      addToast('error', t('common.error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleMovements = (supplierId: string) => {
    if (expandedSupplier === supplierId) {
      setExpandedSupplier(null);
      clearMovements();
    } else {
      setExpandedSupplier(supplierId);
      fetchSupplierMovements(supplierId);
    }
  };

  const totalDebt = suppliers.reduce((sum, s) => sum + s.balanceDue, 0);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold dark:text-white text-surface-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Truck size={22} className="text-white" />
            </div>
            {t('suppliers.title')}
          </h1>
          <p className="text-sm text-surface-400 mt-1">{t('suppliers.subtitle')}</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          {t('suppliers.addSupplier')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center border border-blue-500/20">
          <div className="w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Truck size={20} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400">{suppliers.length}</p>
          <p className="text-xs text-surface-400 font-medium">{t('suppliers.totalSuppliers')}</p>
        </div>
        <div className="card p-4 text-center border border-coral-500/20">
          <div className="w-10 h-10 bg-coral-500/15 rounded-xl flex items-center justify-center mx-auto mb-2">
            <DollarSign size={20} className="text-coral-400" />
          </div>
          <p className="text-2xl font-bold text-coral-400">{totalDebt.toFixed(0)} MRU</p>
          <p className="text-xs text-surface-400 font-medium">{t('suppliers.totalDebt')}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('suppliers.search')}
          className="input-field w-full pl-10 pr-4 py-2.5"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-coral-500/10 rounded-xl text-sm text-coral-400">{error}</div>
      )}

      {/* Suppliers List */}
      {loading && suppliers.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="card rounded-2xl border dark:border-white/5 border-black/5 shadow-card p-12 text-center">
          <Truck size={40} className="text-surface-300 mx-auto mb-3" />
          <p className="text-surface-400 font-medium">{t('suppliers.noSuppliers')}</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
            <Plus size={16} />
            {t('suppliers.addSupplier')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {suppliers.map((supplier) => (
            <div key={supplier._id} className="card rounded-xl border dark:border-white/5 border-black/5 shadow-sm overflow-hidden">
              <button
                onClick={() => handleToggleMovements(supplier._id)}
                className="w-full text-left p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <Truck size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold dark:text-white text-surface-900 text-sm">{supplier.name}</p>
                    <div className="flex items-center gap-3 text-xs text-surface-400 mt-0.5">
                      {supplier.phone && (
                        <span className="flex items-center gap-1"><Phone size={10} />{supplier.phone}</span>
                      )}
                      {supplier.email && (
                        <span className="flex items-center gap-1"><Mail size={10} />{supplier.email}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${supplier.balanceDue > 0 ? 'text-coral-400' : 'text-emerald-400'}`}>
                    {supplier.balanceDue.toFixed(0)} MRU
                  </span>
                  {expandedSupplier === supplier._id ? (
                    <ChevronUp size={16} className="text-surface-400" />
                  ) : (
                    <ChevronDown size={16} className="text-surface-400" />
                  )}
                </div>
              </button>

              {/* Movements */}
              {expandedSupplier === supplier._id && (
                <div className="border-t dark:border-white/5 border-black/5 p-4 bg-surface-50/50 dark:bg-surface-900/50">
                  <h4 className="text-xs font-bold text-surface-400 uppercase mb-3">{t('suppliers.movements')}</h4>
                  {selectedSupplierMovements.length === 0 ? (
                    <p className="text-sm text-surface-400 text-center py-4">{t('suppliers.noMovements')}</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedSupplierMovements.map((mov) => (
                        <div key={mov._id} className="flex items-center justify-between py-2 border-b dark:border-white/5 border-black/5 last:border-0">
                          <div className="flex items-center gap-2">
                            {mov.type === 'payment' ? (
                              <ArrowUpCircle size={14} className="text-emerald-400" />
                            ) : (
                              <ArrowDownCircle size={14} className="text-coral-400" />
                            )}
                            <div>
                              <p className="text-sm dark:text-surface-200 text-surface-700">{mov.description}</p>
                              <p className="text-xs text-surface-400">{new Date(mov.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${mov.type === 'payment' ? 'text-emerald-400' : 'text-coral-400'}`}>
                            {mov.type === 'payment' ? '-' : '+'}{mov.amount.toFixed(0)} MRU
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Supplier Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md card p-6 animate-scale-in mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-display font-bold dark:text-white text-surface-900">{t('suppliers.addSupplier')}</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg dark:hover:bg-white/5 hover:bg-black/5 text-surface-400 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('common.name')} *</label>
                <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('common.phone')}</label>
                <input type="tel" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('common.email')}</label>
                <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">{t('common.cancel')}</button>
                <button type="submit" disabled={isCreating} className="btn-primary">
                  {isCreating ? t('common.saving') : t('suppliers.addSupplier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
