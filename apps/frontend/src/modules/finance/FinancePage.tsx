import { useEffect, useState } from 'react';
import { financeService, FinanceSummary } from '../../services/finance.service';
import { useUIStore } from '../../stores/uiStore';
import { useI18n } from '../../i18n/I18nContext';
import { TrendingUp, TrendingDown, DollarSign, Plus, X, Trash2, CreditCard, Banknote, Smartphone, BarChart3 } from 'lucide-react';

export function FinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'income'>('overview');
  const { addToast } = useUIStore();
  const { t } = useI18n();

  const categoryLabels: Record<string, string> = {
    salary: t('finance.salaries'),
    rent: t('finance.rent'),
    electricity: t('finance.electricity'),
    water: t('finance.water'),
    gas: t('finance.gas'),
    internet: t('finance.internet'),
    maintenance: t('finance.maintenance'),
    supplies: t('finance.supplies'),
    marketing: t('finance.marketing'),
    insurance: t('finance.insurance'),
    tax: t('finance.tax'),
    other: t('finance.other'),
  };

  const categoryColors: Record<string, string> = {
    salary: 'bg-blue-400/10 text-blue-400',
    rent: 'bg-purple-400/10 text-purple-400',
    electricity: 'bg-yellow-400/10 text-yellow-400',
    water: 'bg-cyan-400/10 text-cyan-400',
    gas: 'bg-orange-400/10 text-orange-400',
    internet: 'bg-brand-400/10 text-brand-400',
    maintenance: 'bg-amber-400/10 text-amber-400',
    supplies: 'bg-brand-400/10 text-brand-400',
    marketing: 'bg-pink-400/10 text-pink-400',
    insurance: 'bg-teal-400/10 text-teal-400',
    tax: 'bg-coral-400/10 text-coral-400',
    other: 'dark:bg-white/5 dark:text-surface-300 bg-black/5 text-surface-600',
  };

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'other',
    vendor: '',
    paymentMethod: 'cash',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { loadSummary(); }, []);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const data = await financeService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load finance summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;
    try {
      await financeService.createExpense({
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        vendor: formData.vendor || undefined,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || undefined,
        date: formData.date,
      });
      addToast('success', t('common.success'));
      setShowAddExpense(false);
      setFormData({ description: '', amount: '', category: 'other', vendor: '', paymentMethod: 'cash', notes: '', date: new Date().toISOString().split('T')[0] });
      loadSummary();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await financeService.deleteExpense(id);
      addToast('success', t('common.success'));
      loadSummary();
    } catch (error) {
      addToast('error', t('common.error'));
    }
  };

  const getMaxDailyAmount = () => {
    if (!summary) return 1;
    const allAmounts = [...summary.dailyIncome, ...summary.dailyExpenses].map((d) => d.amount);
    return Math.max(...allAmounts, 1);
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 dark:border-white border-surface-900"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white text-surface-900">{t('finance.title')}</h1>
          <p className="dark:text-surface-300 text-surface-500">{t('finance.subtitle')}</p>
        </div>
        <button onClick={() => setShowAddExpense(true)} className="btn-primary flex items-center space-x-2 px-4 py-2 rounded-md">
          <Plus size={20} />
          <span>{t('finance.addExpense')}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">{t('finance.totalIncome')}</p>
              <p className="text-3xl font-bold text-brand-400">{(summary?.totalIncome || 0).toLocaleString()} MRU</p>
            </div>
            <div className="p-3 bg-brand-400/10 rounded-full"><TrendingUp size={24} className="text-brand-400" /></div>
          </div>
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <span className="flex items-center text-surface-400"><Banknote size={14} className="mr-1" /> {summary?.incomeByMethod.cash.toLocaleString() || 0}</span>
            <span className="flex items-center text-surface-400"><CreditCard size={14} className="mr-1" /> {summary?.incomeByMethod.card.toLocaleString() || 0}</span>
            <span className="flex items-center text-surface-400"><Smartphone size={14} className="mr-1" /> {summary?.incomeByMethod.mobile.toLocaleString() || 0}</span>
          </div>
        </div>

        <div className="card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">{t('finance.totalExpenses')}</p>
              <p className="text-3xl font-bold text-coral-400">{(summary?.totalExpenses || 0).toLocaleString()} MRU</p>
            </div>
            <div className="p-3 bg-coral-400/10 rounded-full"><TrendingDown size={24} className="text-coral-400" /></div>
          </div>
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary?.expensesByCategory || {}).map(([cat, amount]) => (
                <span key={cat} className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[cat] || 'dark:bg-white/5 dark:text-surface-300 bg-surface-100 text-surface-600'}`}>
                  {categoryLabels[cat] || cat}: {amount.toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={`card rounded-lg p-6 ${(summary?.netProfit || 0) >= 0 ? 'border-l-4 border-brand-500' : 'border-l-4 border-coral-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">{t('finance.netProfit')}</p>
              <p className={`text-3xl font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-brand-400' : 'text-coral-400'}`}>
                {(summary?.netProfit || 0).toLocaleString()} MRU
              </p>
            </div>
            <div className={`p-3 ${(summary?.netProfit || 0) >= 0 ? 'bg-brand-400/10' : 'bg-coral-400/10'} rounded-full`}>
              <DollarSign size={24} className={`${(summary?.netProfit || 0) >= 0 ? 'text-brand-400' : 'text-coral-400'}`} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-surface-400">
              {t('finance.profitMargin')}: {summary?.totalIncome ? ((summary.netProfit / summary.totalIncome) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        {(['overview', 'expenses', 'income'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab ? 'bg-brand-500 text-white' : 'dark:bg-white/5 dark:text-surface-300 bg-black/5 text-surface-600 dark:hover:bg-white/10 hover:bg-black/10'}`}>
            {t(`finance.${tab}`)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 size={20} className="mr-2" /> {t('finance.last7Days')}
            </h3>
            <div className="space-y-3">
              {getLast7Days().map((day) => {
                const income = summary?.dailyIncome.find((d) => d.date === day)?.amount || 0;
                const expense = summary?.dailyExpenses.find((d) => d.date === day)?.amount || 0;
                const max = getMaxDailyAmount();
                return (
                  <div key={day} className="flex items-center space-x-3">
                    <div className="w-20 text-xs dark:text-surface-400 text-surface-500">{new Date(day).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center">
                        <div className="h-4 bg-brand-400 rounded" style={{ width: `${(income / max) * 100}%`, minWidth: income > 0 ? '4px' : '0' }} />
                        {income > 0 && <span className="ml-2 text-xs text-brand-400">{income.toLocaleString()}</span>}
                      </div>
                      <div className="flex items-center">
                        <div className="h-4 bg-coral-400 rounded" style={{ width: `${(expense / max) * 100}%`, minWidth: expense > 0 ? '4px' : '0' }} />
                        {expense > 0 && <span className="ml-2 text-xs text-coral-400">{expense.toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center mt-4 space-x-4 text-sm">
              <span className="flex items-center"><div className="w-3 h-3 bg-brand-400 rounded mr-1" /> {t('finance.income')}</span>
              <span className="flex items-center"><div className="w-3 h-3 bg-coral-400 rounded mr-1" /> {t('finance.expenses')}</span>
            </div>
          </div>

          <div className="card rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{t('finance.recentTransactions')}</h3>
            <div className="space-y-3 max-h-96 overflow-auto">
              {[...(summary?.recentPayments || []).map((p: any) => ({
                type: 'income' as const, id: p._id,
                description: `Order #${p.orderId?.orderNumber || p._id.slice(-6).toUpperCase()}`,
                amount: p.amount, method: p.method, date: p.createdAt, user: p.userId?.name,
              })),
              ...(summary?.recentExpenses || []).map((e: any) => ({
                type: 'expense' as const, id: e._id, description: e.description,
                amount: e.amount, category: e.category, date: e.date, user: e.userId?.name,
              }))
              ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 15)
              .map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 dark:bg-white/5 bg-surface-100 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-brand-400/10' : 'bg-coral-400/10'}`}>
                      {tx.type === 'income' ? <TrendingUp size={16} className="text-brand-400" /> : <TrendingDown size={16} className="text-coral-400" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium dark:text-white text-surface-900">{tx.description}</div>
                      <div className="text-xs dark:text-surface-400 text-surface-500">{new Date(tx.date).toLocaleDateString()} {tx.user && `- ${tx.user}`}</div>
                    </div>
                  </div>
                  <div className={`font-bold ${tx.type === 'income' ? 'text-brand-400' : 'text-coral-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} MRU
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="card rounded-lg overflow-hidden">
          <table className="min-w-full divide-y dark:divide-white/5 divide-black/5">
            <thead className="dark:bg-white/5 bg-surface-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium dark:text-surface-400 text-surface-500 uppercase">{t('finance.description')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium dark:text-surface-400 text-surface-500 uppercase">{t('finance.category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium dark:text-surface-400 text-surface-500 uppercase">{t('common.amount')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium dark:text-surface-400 text-surface-500 uppercase">{t('common.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium dark:text-surface-400 text-surface-500 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-white/5 divide-black/5">
              {(summary?.recentExpenses || []).length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center dark:text-surface-400 text-surface-500">{t('finance.noExpenses')}</td></tr>
              ) : (
                (summary?.recentExpenses || []).map((expense) => (
                  <tr key={expense._id} className="dark:hover:bg-white/5 hover:bg-surface-100">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium dark:text-white text-surface-900">{expense.description}</div>
                      {expense.vendor && <div className="text-xs dark:text-surface-400 text-surface-500">{expense.vendor}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryColors[expense.category] || 'dark:bg-white/5 dark:text-surface-300 bg-surface-100 text-surface-600'}`}>
                        {categoryLabels[expense.category] || expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-coral-400">{expense.amount.toLocaleString()} MRU</td>
                    <td className="px-6 py-4 text-sm text-surface-400">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDeleteExpense(expense._id)} className="text-coral-400 hover:text-coral-500"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Income Tab */}
      {activeTab === 'income' && (
        <div className="card rounded-lg overflow-hidden">
          <table className="min-w-full divide-y dark:divide-white/5 divide-black/5">
            <thead className="dark:bg-white/5 bg-surface-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium dark:text-surface-400 text-surface-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium dark:text-surface-400 text-surface-500 uppercase">{t('common.amount')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium dark:text-surface-400 text-surface-500 uppercase">{t('finance.category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium dark:text-surface-400 text-surface-500 uppercase">{t('common.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-white/5 divide-black/5">
              {(summary?.recentPayments || []).length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center dark:text-surface-400 text-surface-500">{t('finance.noIncome')}</td></tr>
              ) : (
                (summary?.recentPayments || []).map((payment: any) => (
                  <tr key={payment._id} className="dark:hover:bg-white/5 hover:bg-surface-100">
                    <td className="px-6 py-4 text-sm font-medium dark:text-white text-surface-900">#{payment.orderId?.orderNumber || payment._id.slice(-6).toUpperCase()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-brand-400">{payment.amount.toLocaleString()} MRU</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payment.method === 'cash' ? 'bg-brand-400/10 text-brand-400' :
                        payment.method === 'card' ? 'bg-blue-400/10 text-blue-400' :
                        'bg-purple-400/10 text-purple-400'
                      }`}>{payment.method}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-400">{new Date(payment.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium dark:text-white text-surface-900">{t('finance.addExpense')}</h3>
              <button onClick={() => setShowAddExpense(false)} className="dark:text-surface-400 text-surface-500 dark:hover:text-surface-300 hover:text-surface-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddExpense}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium dark:text-surface-300 text-surface-600 mb-1">{t('finance.description')} *</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required className="input-field w-full rounded-md" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-surface-300 text-surface-600 mb-1">{t('common.amount')} (MRU) *</label>
                    <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required min="0.01" step="0.01" className="input-field w-full rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-surface-300 text-surface-600 mb-1">{t('finance.category')} *</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field w-full rounded-md">
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-surface-300 text-surface-600 mb-1">{t('finance.vendor')}</label>
                    <input type="text" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} className="input-field w-full rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-surface-300 text-surface-600 mb-1">{t('common.date')}</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-field w-full rounded-md" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-surface-300 text-surface-600 mb-1">{t('finance.category')}</label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="input-field w-full rounded-md">
                    <option value="cash">{t('finance.cash')}</option>
                    <option value="card">{t('finance.card')}</option>
                    <option value="bank_transfer">{t('finance.bankTransfer')}</option>
                    <option value="check">{t('finance.check')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-surface-300 text-surface-600 mb-1">{t('finance.notes')}</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field w-full rounded-md" rows={2} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowAddExpense(false)} className="btn-secondary px-4 py-2 rounded-md">{t('common.cancel')}</button>
                <button type="submit" className="btn-primary px-4 py-2 rounded-md">{t('finance.addExpense')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
