import { useEffect, useState } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useUIStore } from '../../stores/uiStore';
import { useI18n } from '../../i18n/I18nContext';
import { supplierService, Supplier } from '../../services/supplier.service';
import {
  Package, Plus, Search, AlertTriangle, TrendingUp,
  X, ArrowUpCircle, RotateCcw, Filter
} from 'lucide-react';

type AdjustType = 'replenishment' | 'deduction' | 'waste' | 'adjustment';

export function InventoryPage() {
  const {
    items, alerts, stockValue,
    loading, error, fetchInventory, createItem, adjustStock,
    incrementStock, fetchAlerts, fetchStockValue,
  } = useInventoryStore();
  const { addToast } = useUIStore();
  const { t } = useI18n();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState<string | null>(null);
  const [showIncrementModal, setShowIncrementModal] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '', category: '', unit: 'kg', quantity: 0,
    threshold: 5, unitPrice: 0, supplier: '', supplierId: '', expiryDate: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    quantity: 0, type: 'replenishment' as AdjustType, reason: '',
  });

  const [incrementForm, setIncrementForm] = useState({
    quantity: 1, unitPrice: 0, supplierId: '', paidSupplierPrice: 0,
  });

  useEffect(() => {
    fetchInventory({ search, category: categoryFilter, page: '1', limit: '50' });
    fetchAlerts();
    fetchStockValue();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory({ search, category: categoryFilter, page: '1', limit: '50' });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter]);

  useEffect(() => {
    supplierService.getSuppliers().then(setSuppliers).catch(() => {});
  }, []);

  const categories = [...new Set(items.map((i) => i.category))];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createItem({
        ...createForm,
        supplierId: createForm.supplierId || undefined,
        expiryDate: createForm.expiryDate || undefined,
      });
      setShowCreateModal(false);
      setCreateForm({ name: '', category: '', unit: 'kg', quantity: 0, threshold: 5, unitPrice: 0, supplier: '', supplierId: '', expiryDate: '' });
      addToast('success', t('common.success'));
      fetchStockValue();
      fetchAlerts();
    } catch {
      addToast('error', t('common.error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjustModal) return;
    try {
      await adjustStock(showAdjustModal, adjustForm);
      setShowAdjustModal(null);
      setAdjustForm({ quantity: 0, type: 'replenishment', reason: '' });
      addToast('success', t('common.success'));
      fetchStockValue();
      fetchAlerts();
    } catch {
      addToast('error', t('common.error'));
    }
  };

  const handleIncrement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showIncrementModal) return;
    try {
      await incrementStock(showIncrementModal, {
        ...incrementForm,
        supplierId: incrementForm.supplierId || undefined,
        paidSupplierPrice: incrementForm.paidSupplierPrice || undefined,
      });
      setShowIncrementModal(null);
      setIncrementForm({ quantity: 1, unitPrice: 0, supplierId: '', paidSupplierPrice: 0 });
      addToast('success', t('common.success'));
      fetchStockValue();
      fetchAlerts();
    } catch {
      addToast('error', t('common.error'));
    }
  };

  const getStockStatus = (item: { quantity: number; threshold: number }) => {
    if (item.quantity <= 3) return { color: 'text-coral-400 bg-coral-500/15', label: t('inventory.critical') };
    if (item.quantity <= item.threshold) return { color: 'text-amber-400 bg-amber-500/15', label: t('inventory.low') };
    return { color: 'text-emerald-400 bg-emerald-500/15', label: t('inventory.good') };
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold dark:text-white text-surface-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Package size={22} className="text-white" />
            </div>
            {t('inventory.title')}
          </h1>
          <p className="text-sm text-surface-400 mt-1">{t('inventory.subtitle')}</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          {t('inventory.addItem')}
        </button>
      </div>

      {/* Stats Cards */}
      {stockValue && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="card p-4 text-center border border-purple-500/20">
            <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Package size={20} className="text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400">{stockValue.totalItems}</p>
            <p className="text-xs text-surface-400 font-medium">{t('inventory.totalItems')}</p>
          </div>
          <div className="card p-4 text-center border border-emerald-500/20">
            <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center mx-auto mb-2">
              <TrendingUp size={20} className="text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stockValue.totalValue.toFixed(0)}</p>
            <p className="text-xs text-surface-400 font-medium">{t('inventory.totalValue')} (MRU)</p>
          </div>
          <div className="card p-4 text-center border border-coral-500/20">
            <div className="w-10 h-10 bg-coral-500/15 rounded-xl flex items-center justify-center mx-auto mb-2">
              <AlertTriangle size={20} className="text-coral-400" />
            </div>
            <p className="text-2xl font-bold text-coral-400">{stockValue.belowThreshold}</p>
            <p className="text-xs text-surface-400 font-medium">{t('inventory.belowThreshold')}</p>
          </div>
        </div>
      )}

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="card p-4 border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-sm font-bold text-amber-400">{t('inventory.stockAlerts')} ({alerts.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.slice(0, 5).map((alert) => (
              <span key={alert._id} className={`text-xs px-2 py-1 rounded-full font-medium ${
                alert.alertType === 'critical' ? 'bg-coral-500/15 text-coral-400' : 'bg-amber-500/15 text-amber-400'
              }`}>
                {alert.name}: {alert.quantity} {alert.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('inventory.search')}
            className="input-field w-full pl-10 pr-4 py-2.5"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-surface-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">{t('inventory.allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-coral-500/10 rounded-xl text-sm text-coral-400">{error}</div>
      )}

      {/* Items List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card rounded-2xl border dark:border-white/5 border-black/5 shadow-card p-12 text-center">
          <Package size={40} className="text-surface-300 mx-auto mb-3" />
          <p className="text-surface-400 font-medium">{t('inventory.noItems')}</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
            <Plus size={16} />
            {t('inventory.addItem')}
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="md:hidden space-y-2">
            {items.map((item) => {
              const status = getStockStatus(item);
              return (
                <div key={item._id} className="card rounded-xl border dark:border-white/5 border-black/5 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                        <Package size={16} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold dark:text-white text-surface-900 text-sm">{item.name}</p>
                        <p className="text-xs text-surface-400">{item.category}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.color}`}>
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-surface-400 mb-3">
                    <span>{t('inventory.threshold')}: {item.threshold}</span>
                    <span>{item.unitPrice} MRU/{item.unit}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowIncrementModal(item._id); setIncrementForm({ ...incrementForm, unitPrice: item.unitPrice }); }}
                      className="flex-1 btn-primary text-xs py-1.5 flex items-center justify-center gap-1"
                    >
                      <ArrowUpCircle size={14} />
                      {t('inventory.restock')}
                    </button>
                    <button
                      onClick={() => setShowAdjustModal(item._id)}
                      className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1"
                    >
                      <RotateCcw size={14} />
                      {t('inventory.adjust')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block card rounded-2xl border dark:border-white/5 border-black/5 shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-white/5 border-black/5">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-400 uppercase">{t('common.name')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-400 uppercase">{t('inventory.category')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-400 uppercase">{t('inventory.quantity')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-400 uppercase">{t('inventory.threshold')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-400 uppercase">{t('inventory.unitPrice')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-400 uppercase">{t('common.status')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-surface-400 uppercase">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item._id} className="table-row">
                      <td className="px-5 py-3">
                        <span className="font-semibold text-sm dark:text-white text-surface-900">{item.name}</span>
                        {item.supplier && <p className="text-xs text-surface-400">{item.supplier}</p>}
                      </td>
                      <td className="px-5 py-3 text-sm text-surface-400">{item.category}</td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-sm dark:text-white text-surface-900">{item.quantity}</span>
                        <span className="text-xs text-surface-400 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-surface-400">{item.threshold}</td>
                      <td className="px-5 py-3 text-sm text-surface-400">{item.unitPrice} MRU</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setShowIncrementModal(item._id); setIncrementForm({ ...incrementForm, unitPrice: item.unitPrice }); }}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            title={t('inventory.restock')}
                          >
                            <ArrowUpCircle size={16} />
                          </button>
                          <button
                            onClick={() => setShowAdjustModal(item._id)}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                            title={t('inventory.adjust')}
                          >
                            <RotateCcw size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create Item Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg card p-6 animate-scale-in max-h-[85vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-display font-bold dark:text-white text-surface-900">{t('inventory.addItem')}</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg dark:hover:bg-white/5 hover:bg-black/5 text-surface-400 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('common.name')} *</label>
                  <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('inventory.category')} *</label>
                  <input type="text" value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })} required className="input-field" placeholder={t('inventory.categoryPlaceholder')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('inventory.unit')} *</label>
                  <select value={createForm.unit} onChange={(e) => setCreateForm({ ...createForm, unit: e.target.value })} className="input-field">
                    <option value="kg">{t('inventory.unitKg')}</option>
                    <option value="g">{t('inventory.unitG')}</option>
                    <option value="L">{t('inventory.unitL')}</option>
                    <option value="ml">{t('inventory.unitMl')}</option>
                    <option value="pcs">{t('inventory.unitPcs')}</option>
                    <option value="box">{t('inventory.unitBox')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('inventory.quantity')} *</label>
                  <input type="number" value={createForm.quantity} onChange={(e) => setCreateForm({ ...createForm, quantity: parseFloat(e.target.value) || 0 })} min="0" step="0.1" required className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('inventory.threshold')} *</label>
                  <input type="number" value={createForm.threshold} onChange={(e) => setCreateForm({ ...createForm, threshold: parseFloat(e.target.value) || 0 })} min="0" step="0.1" required className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('inventory.unitPrice')} *</label>
                  <input type="number" value={createForm.unitPrice} onChange={(e) => setCreateForm({ ...createForm, unitPrice: parseFloat(e.target.value) || 0 })} min="0" step="0.01" required className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('inventory.supplier')}</label>
                  <select value={createForm.supplierId} onChange={(e) => {
                    const s = suppliers.find((s) => s._id === e.target.value);
                    setCreateForm({ ...createForm, supplierId: e.target.value, supplier: s?.name || '' });
                  }} className="input-field">
                    <option value="">{t('inventory.noSupplier')}</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('inventory.expiryDate')}</label>
                  <input type="date" value={createForm.expiryDate} onChange={(e) => setCreateForm({ ...createForm, expiryDate: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">{t('common.cancel')}</button>
                <button type="submit" disabled={isCreating} className="btn-primary">
                  {isCreating ? t('common.saving') : t('inventory.addItem')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md card p-6 animate-scale-in mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-display font-bold dark:text-white text-surface-900">{t('inventory.adjustStock')}</h3>
              <button onClick={() => setShowAdjustModal(null)} className="p-2 rounded-lg dark:hover:bg-white/5 hover:bg-black/5 text-surface-400 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdjust} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('inventory.adjustType')} *</label>
                <select value={adjustForm.type} onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as AdjustType })} className="input-field">
                  <option value="replenishment">{t('inventory.replenishment')}</option>
                  <option value="deduction">{t('inventory.deduction')}</option>
                  <option value="waste">{t('inventory.waste')}</option>
                  <option value="adjustment">{t('inventory.adjustment')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('inventory.quantity')} *</label>
                <input type="number" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseFloat(e.target.value) || 0 })} min="0" step="0.1" required className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('inventory.reason')} *</label>
                <input type="text" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} required className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdjustModal(null)} className="btn-secondary">{t('common.cancel')}</button>
                <button type="submit" className="btn-primary">{t('common.confirm')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Increment Stock Modal */}
      {showIncrementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md card p-6 animate-scale-in mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-display font-bold dark:text-white text-surface-900">{t('inventory.restock')}</h3>
              <button onClick={() => setShowIncrementModal(null)} className="p-2 rounded-lg dark:hover:bg-white/5 hover:bg-black/5 text-surface-400 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleIncrement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('inventory.quantity')} *</label>
                <input type="number" value={incrementForm.quantity} onChange={(e) => setIncrementForm({ ...incrementForm, quantity: parseFloat(e.target.value) || 0 })} min="1" step="0.1" required className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('inventory.unitPrice')}</label>
                <input type="number" value={incrementForm.unitPrice} onChange={(e) => setIncrementForm({ ...incrementForm, unitPrice: parseFloat(e.target.value) || 0 })} min="0" step="0.01" className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('inventory.supplier')}</label>
                <select value={incrementForm.supplierId} onChange={(e) => setIncrementForm({ ...incrementForm, supplierId: e.target.value })} className="input-field">
                  <option value="">{t('inventory.noSupplier')}</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              {incrementForm.supplierId && (
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('inventory.supplierPrice')}</label>
                  <input type="number" value={incrementForm.paidSupplierPrice} onChange={(e) => setIncrementForm({ ...incrementForm, paidSupplierPrice: parseFloat(e.target.value) || 0 })} min="0" step="0.01" className="input-field" />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowIncrementModal(null)} className="btn-secondary">{t('common.cancel')}</button>
                <button type="submit" className="btn-primary">{t('inventory.restock')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
