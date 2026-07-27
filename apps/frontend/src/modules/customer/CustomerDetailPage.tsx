import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCustomerStore } from '../../stores/customerStore';
import { Edit, ArrowLeft, Phone, ShoppingCart, Calendar, X, Plus, CreditCard, Info } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

export function CustomerDetailPage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    selectedCustomer,
    totalSpent,
    lastPurchaseAt,
    totalOrders,
    loading,
    error,
    fetchCustomerById,
    updateCustomer,
    clearSelectedItem,
  } = useCustomerStore();

  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtAction, setDebtAction] = useState<'add' | 'settle'>('add');
  const [debtAmount, setDebtAmount] = useState('');
  const [isSavingDebt, setIsSavingDebt] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCustomerById(id);
    }
    return () => clearSelectedItem();
  }, [id]);

  const handleOpenDebtModal = () => {
    setDebtAction('add');
    setDebtAmount('');
    setShowDebtModal(true);
  };

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setIsSavingDebt(true);
    try {
      const currentDebt = selectedCustomer.debt || 0;
      const amountNum = parseFloat(debtAmount) || 0;
      const newDebt = debtAction === 'add'
        ? currentDebt + amountNum
        : Math.max(0, currentDebt - amountNum);

      await updateCustomer(selectedCustomer._id, { debt: newDebt });
      setShowDebtModal(false);
    } catch (err) {
      console.error('Failed to update debt', err);
    } finally {
      setIsSavingDebt(false);
    }
  };

  if (loading && !selectedCustomer) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !selectedCustomer) {
    return (
      <div className="p-4">
        <div className="p-3 bg-coral-500/10 rounded-xl text-sm text-coral-400">{error || t('form.customerNotFound')}</div>
        <button onClick={() => navigate('/customers')} className="mt-3 text-brand-600 text-sm font-medium">
          {t('form.backToCustomers')}
        </button>
      </div>
    );
  }

  const currentDebt = selectedCustomer.debt || 0;
  const parsedAmount = parseFloat(debtAmount) || 0;
  const previewNewDebt = debtAction === 'add'
    ? currentDebt + parsedAmount
    : Math.max(0, currentDebt - parsedAmount);

  return (
    <div className="p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/customers')} className="text-brand-600 text-sm font-medium flex items-center gap-1">
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>
        <Link
          to={`/customers/${selectedCustomer._id}/edit`}
          className="btn-secondary flex items-center gap-1.5 text-sm"
        >
          <Edit size={14} />
          {t('common.edit')}
        </Link>
      </div>

      {/* Customer header */}
      <div className="card rounded-2xl border dark:border-white/5 border-black/5 shadow-card p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xl shrink-0">
            {selectedCustomer.firstName?.charAt(0)}{selectedCustomer.lastName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold dark:text-white text-surface-900 truncate">
              {selectedCustomer.firstName} {selectedCustomer.lastName}
            </h1>
            <div className="flex items-center gap-1.5 text-sm text-surface-400 mt-0.5">
              <Phone size={14} />
              {selectedCustomer.phone}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-500/10">
            <ShoppingCart size={18} className="text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalOrders}</p>
            <p className="text-[10px] text-surface-400 font-medium">{t('form.orders')}</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/10">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalSpent.toFixed(0)}</p>
            <p className="text-[10px] text-surface-400 font-medium">{t('form.mruSpent')}</p>
          </div>
          <div
            onClick={handleOpenDebtModal}
            className={`text-center p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
              currentDebt > 0 
                ? 'bg-coral-500/10 border border-coral-500/20' 
                : 'bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-white/5'
            }`}
          >
            <p className={`text-lg font-bold mt-0.5 ${currentDebt > 0 ? 'text-coral-600 dark:text-coral-400' : 'text-surface-400'}`}>
              {currentDebt}
            </p>
            <div className="flex items-center justify-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-400">
              <Info size={12} />
              <span>التفاصيل</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-surface-400">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {t('form.lastPurchase') + ':'} {lastPurchaseAt ? new Date(lastPurchaseAt).toLocaleDateString() : t('form.never')}
          </span>
        </div>
      </div>

      {showDebtModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-900 rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white">إدارة دين العميل</h3>
                <p className="text-xs text-surface-400 mt-0.5">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
              </div>
              <button onClick={() => setShowDebtModal(false)} className="p-1 rounded-lg text-surface-400 hover:text-white hover:bg-white/5 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Current Balance Banner */}
            <div className="flex items-center justify-between p-3.5 bg-surface-800/80 rounded-xl border border-white/5">
              <span className="text-sm text-surface-400 font-medium">الدين الحالي:</span>
              <span className={`text-base font-bold ${currentDebt > 0 ? 'text-coral-400' : 'text-emerald-400'}`}>
                {currentDebt} MRU
              </span>
            </div>

            {/* Action Toggle (Add vs Settle) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-800 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setDebtAction('add')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  debtAction === 'add'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-surface-400 hover:text-white'
                }`}
              >
                <Plus size={15} />
                إضافة دين
              </button>
              <button
                type="button"
                onClick={() => setDebtAction('settle')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  debtAction === 'settle'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-surface-400 hover:text-white'
                }`}
              >
                <CreditCard size={15} />
                سداد دين
              </button>
            </div>

            {/* Debt Form */}
            <form onSubmit={handleSaveDebt} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-surface-300">
                    {debtAction === 'add' ? 'المبلغ المراد إضافته للدين (MRU)' : 'المبلغ المراد سداده (MRU)'}
                  </label>
                  {debtAction === 'settle' && currentDebt > 0 && (
                    <button
                      type="button"
                      onClick={() => setDebtAmount(currentDebt.toString())}
                      className="text-xs text-emerald-400 hover:underline font-semibold"
                    >
                      تسديد كامل ({currentDebt} MRU)
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  value={debtAmount}
                  onChange={(e) => setDebtAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="input-field w-full text-base font-semibold"
                  placeholder="0"
                  autoFocus
                />
              </div>

              {/* Live Preview */}
              {parsedAmount > 0 && (
                <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20 flex justify-between items-center text-xs">
                  <span className="text-surface-300 font-medium">
                    {debtAction === 'add' ? 'الدين الجديد بعد الإضافة:' : 'الدين المتبقي بعد السداد:'}
                  </span>
                  <span className={`font-bold text-sm ${previewNewDebt > 0 ? 'text-coral-400' : 'text-emerald-400'}`}>
                    {previewNewDebt} MRU
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDebtModal(false)}
                  className="btn-secondary text-sm"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSavingDebt || parsedAmount <= 0}
                  className={`btn-primary text-sm disabled:opacity-50 ${
                    debtAction === 'settle' ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                  }`}
                >
                  {isSavingDebt ? t('common.saving') : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
