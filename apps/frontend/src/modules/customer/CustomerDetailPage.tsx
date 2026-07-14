import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCustomerStore } from '../../stores/customerStore';
import { RedemptionModal } from '../../components/customers/RedemptionModal';
import { Edit, ArrowLeft, Phone, Star, ShoppingCart, Calendar } from 'lucide-react';
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
    loyaltyHistory,
    loyaltyHistoryTotal,
    loading,
    error,
    fetchCustomerById,
    fetchCustomerLoyaltyHistory,
    clearSelectedItem,
  } = useCustomerStore();

  const [loyaltyPage, setLoyaltyPage] = useState(1);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCustomerById(id);
      fetchCustomerLoyaltyHistory(id, 1, 10);
    }
    return () => clearSelectedItem();
  }, [id]);

  const handleLoyaltyPageChange = (newPage: number) => {
    if (id) {
      setLoyaltyPage(newPage);
      fetchCustomerLoyaltyHistory(id, newPage, 10);
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
      <div className="card rounded-2xl border border-white/5 shadow-card p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xl shrink-0">
            {selectedCustomer.firstName?.charAt(0)}{selectedCustomer.lastName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold text-white truncate">
              {selectedCustomer.firstName} {selectedCustomer.lastName}
            </h1>
            <div className="flex items-center gap-1.5 text-sm text-surface-400 mt-0.5">
              <Phone size={14} />
              {selectedCustomer.phone}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="text-center p-3 bg-brand-50 rounded-xl">
            <Star size={18} className="text-brand-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-brand-600">{selectedCustomer.loyaltyPoints}</p>
            <p className="text-[10px] text-surface-400 font-medium">{t('form.points')}</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <ShoppingCart size={18} className="text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-600">{totalOrders}</p>
            <p className="text-[10px] text-surface-400 font-medium">{t('form.orders')}</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-xl">
            <p className="text-lg font-bold text-emerald-600 mt-1">{totalSpent.toFixed(0)}</p>
            <p className="text-[10px] text-surface-400 font-medium">{t('form.mruSpent')}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-surface-400">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {t('form.lastPurchase') + ':'} {lastPurchaseAt ? new Date(lastPurchaseAt).toLocaleDateString() : t('form.never')}
          </span>
          <button
            onClick={() => setShowRedeemModal(true)}
            disabled={selectedCustomer.loyaltyPoints === 0}
            className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
          >
            {t('form.redeemPoints')}
          </button>
        </div>
      </div>

      {/* Loyalty History */}
      <div className="card rounded-2xl border border-white/5 shadow-card p-5">
        <h2 className="text-sm font-bold text-white mb-3">{t('form.loyaltyHistory')}</h2>
        {loyaltyHistory.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-6">{t('form.noLoyaltyHistory')}</p>
        ) : (
          <div className="space-y-2">
            {loyaltyHistory.map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    transaction.type === 'earn' ? 'bg-brand-400' :
                    transaction.type === 'redeem' ? 'bg-coral-400' : 'bg-blue-400'
                  }`} />
                  <div>
                    <p className="text-sm text-surface-300">{transaction.description}</p>
                    <p className="text-xs text-surface-400">{new Date(transaction.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${
                  transaction.type === 'earn' ? 'text-brand-400' : 'text-coral-400'
                }`}>
                  {transaction.type === 'earn' ? '+' : '-'}{transaction.points}
                </span>
              </div>
            ))}
          </div>
        )}

        {loyaltyHistoryTotal > 10 && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-surface-400">
              {loyaltyPage} / {Math.ceil(loyaltyHistoryTotal / 10)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleLoyaltyPageChange(loyaltyPage - 1)}
                disabled={loyaltyPage === 1}
                className="btn-secondary text-xs px-3 py-1 disabled:opacity-50"
              >
                {t('common.previous')}
              </button>
              <button
                onClick={() => handleLoyaltyPageChange(loyaltyPage + 1)}
                disabled={loyaltyPage * 10 >= loyaltyHistoryTotal}
                className="btn-secondary text-xs px-3 py-1 disabled:opacity-50"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {showRedeemModal && (
        <RedemptionModal
          customerId={selectedCustomer._id}
          customerName={`${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
          currentPoints={selectedCustomer.loyaltyPoints}
          orderId="temp-order-id"
          onClose={() => setShowRedeemModal(false)}
        />
      )}
    </div>
  );
}
