import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTentStore } from '../../stores/tentStore';
import { useUIStore } from '../../stores/uiStore';
import { useI18n } from '../../i18n/I18nContext';
import { TentDTO, TentStatus, TentSize } from '../../types';
import { Plus, X, Filter, Tent, Bell } from 'lucide-react';

export function TentMapPage() {
  const { tents, statusSummary, fetchTents, fetchTentStatusSummary, isLoading, createTent, markTentEmpty } = useTentStore();
  const { addToast } = useUIStore();
  const { t } = useI18n();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ tentNumber: 1, size: 'medium' as TentSize });
  const navigate = useNavigate();

  const statusConfig: Record<TentStatus, { bg: string; text: string; dot: string; label: string; gradient: string; glow: string }> = {
    free: {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      label: t('tents.free'),
      gradient: 'from-emerald-400 to-teal-500',
      glow: 'shadow-emerald-500/20',
    },
    occupied: {
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      label: t('tents.occupied'),
      gradient: 'from-amber-400 to-orange-500',
      glow: 'shadow-amber-500/20',
    },
    reserved: {
      bg: 'bg-blue-500/15',
      text: 'text-blue-400',
      dot: 'bg-blue-400',
      label: t('tents.reserved'),
      gradient: 'from-blue-400 to-indigo-500',
      glow: 'shadow-blue-500/20',
    },
    cleaning: {
      bg: 'bg-purple-500/15',
      text: 'text-purple-400',
      dot: 'bg-purple-400',
      label: t('tents.cleaning'),
      gradient: 'from-purple-400 to-violet-500',
      glow: 'shadow-purple-500/20',
    },
  };

  const sizeConfig: Record<TentSize, { label: string; icon: string; color: string }> = {
    small: { label: t('tents.sizeSmall'), icon: '⛺', color: 'text-blue-400' },
    medium: { label: t('tents.sizeMedium'), icon: '🏕️', color: 'text-amber-400' },
    large: { label: t('tents.sizeLarge'), icon: '🏰', color: 'text-emerald-400' },
  };

  useEffect(() => { fetchTents(); fetchTentStatusSummary(); }, [fetchTents, fetchTentStatusSummary]);

  const filteredTents = selectedSize ? tents.filter((t) => t.size === selectedSize) : tents;

  const handleTentClick = (tent: TentDTO) => {
    if (tent.status === 'free') navigate('/pos', { state: { selectedTent: tent } });
  };

  const handleMarkEmpty = async (tentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markTentEmpty(tentId);
      addToast('success', t('tents.markEmpty'));
      fetchTents();
      fetchTentStatusSummary();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    }
  };

  const handleCreateTent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createTent({
        tentNumber: formData.tentNumber,
        size: formData.size,
        position: { x: 0, y: 0 },
      });
      setShowModal(false);
      setFormData({ tentNumber: tents.length + 1, size: 'medium' });
      addToast('success', t('common.success'));
      fetchTents();
      fetchTentStatusSummary();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm text-surface-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Tent size={22} className="text-white" />
            </div>
            {t('tents.title')}
          </h1>
          <p className="text-sm text-surface-400 mt-1">{t('tents.manage')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          {t('tents.addTent')}
        </button>
      </div>

      {/* Status Summary */}
      {statusSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="card p-4 text-center border border-emerald-500/20">
            <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{statusSummary.free}</p>
            <p className="text-xs text-surface-400 font-medium">{t('tents.free')}</p>
          </div>
          <div className="card p-4 text-center border border-amber-500/20">
            <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-amber-400 rounded-full" />
            </div>
            <p className="text-2xl font-bold text-amber-400">{statusSummary.occupied}</p>
            <p className="text-xs text-surface-400 font-medium">{t('tents.occupied')}</p>
          </div>
          <div className="card p-4 text-center border border-blue-500/20">
            <div className="w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{statusSummary.reserved}</p>
            <p className="text-xs text-surface-400 font-medium">{t('tents.reserved')}</p>
          </div>
          <div className="card p-4 text-center border border-purple-500/20">
            <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full" />
            </div>
            <p className="text-2xl font-bold text-purple-400">{statusSummary.cleaning}</p>
            <p className="text-xs text-surface-400 font-medium">{t('tents.cleaning')}</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-10 h-10 bg-surface-800 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Tent size={20} className="text-surface-400" />
            </div>
            <p className="text-2xl font-bold text-white">{statusSummary.total}</p>
            <p className="text-xs text-surface-400 font-medium">{t('tents.total')}</p>
          </div>
        </div>
      )}

      {/* Size Filter */}
      <div className="flex items-center gap-3">
        <Filter size={16} className="text-surface-400" />
        <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="input-field w-auto">
          <option value="">{t('tents.allSizes')}</option>
          <option value="small">{t('tents.sizeSmall')}</option>
          <option value="medium">{t('tents.sizeMedium')}</option>
          <option value="large">{t('tents.sizeLarge')}</option>
        </select>
      </div>

      {/* Tents Grid */}
      <div className="card p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredTents.map((tent) => {
            const status = statusConfig[tent.status] || statusConfig.free;
            const size = sizeConfig[tent.size] || sizeConfig.medium;
            return (
              <button
                key={tent._id}
                onClick={() => handleTentClick(tent)}
                disabled={tent.status !== 'free'}
                className={`relative card p-4 text-center transition-all duration-300 ${
                  tent.status === 'free'
                    ? 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-emerald-300/50 hover:shadow-lg hover:' + status.glow
                    : 'cursor-default opacity-80'
                }`}
              >
                {/* Top gradient bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-xl bg-gradient-to-r ${status.gradient}`} />

                <div className="mt-2">
                  {/* Tent icon */}
                  <div className={`w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-br ${
                    tent.status === 'free'
                      ? 'from-emerald-500/20 to-teal-500/10'
                      : tent.status === 'occupied'
                      ? 'from-amber-500/20 to-orange-500/10'
                      : tent.status === 'reserved'
                      ? 'from-blue-500/20 to-indigo-500/10'
                      : 'from-purple-500/20 to-violet-500/10'
                  } flex items-center justify-center shadow-inner`}>
                    <Tent size={28} className={`${
                      tent.status === 'free'
                        ? 'text-emerald-400'
                        : tent.status === 'occupied'
                        ? 'text-amber-400'
                        : tent.status === 'reserved'
                        ? 'text-blue-400'
                        : 'text-purple-400'
                    }`} />
                  </div>

                  {/* Tent number */}
                  <p className="text-xs font-mono text-surface-500 mb-0.5">#{tent.tentNumber}</p>

                  {/* Size badge */}
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${size.color}`}>
                    {size.icon} {size.label}
                  </span>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>

                {/* Mark Empty Button */}
                {tent.status !== 'free' && (
                  <button
                    onClick={(e) => handleMarkEmpty(tent._id, e)}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-all shadow-sm backdrop-blur-sm"
                    title={t('tents.markEmpty')}
                  >
                    <Bell size={14} />
                  </button>
                )}
              </button>
            );
          })}
        </div>
        {filteredTents.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Tent size={32} className="text-surface-400" />
            </div>
            <p className="text-surface-400 font-medium">{t('tents.noTents')}</p>
          </div>
        )}
      </div>

      {/* Create Tent Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md card p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-display font-bold text-white">{t('tents.createTent')}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/5 text-surface-400 hover:text-surface-300 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">رقم الخيمة *</label>
                  <input type="number" value={formData.tentNumber} onChange={(e) => setFormData({ ...formData, tentNumber: parseInt(e.target.value) || 1 })} min="1" required className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('tents.tentSize')} *</label>
                  <select value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value as TentSize })} required className="input-field">
                    <option value="small">{t('tents.sizeSmall')}</option>
                    <option value="medium">{t('tents.sizeMedium')}</option>
                    <option value="large">{t('tents.sizeLarge')}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">{t('common.cancel')}</button>
                <button type="submit" disabled={isCreating} className="btn-primary">
                  {isCreating ? t('tents.creating') : t('tents.createTent')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
