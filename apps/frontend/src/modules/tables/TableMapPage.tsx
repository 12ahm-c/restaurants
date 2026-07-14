import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTableStore } from '../../stores/tableStore';
import { useUIStore } from '../../stores/uiStore';
import { useI18n } from '../../i18n/I18nContext';
import { TableDTO, TableStatus } from '../../types';
import { Plus, X, Trash2, Table2, Users, Filter } from 'lucide-react';

export function TableMapPage() {
  const { tables, statusSummary, fetchTables, fetchTableStatusSummary, isLoading, createTable, clearTable } = useTableStore();
  const { addToast } = useUIStore();
  const { t } = useI18n();
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', capacity: 4, zone: 'Main' });
  const navigate = useNavigate();

  const statusConfig: Record<TableStatus, { bg: string; text: string; dot: string; label: string; gradient: string }> = {
    free: { bg: 'bg-brand-500/15', text: 'text-brand-400', dot: 'bg-brand-400', label: t('tables.free'), gradient: 'from-brand-400 to-accent-500' },
    occupied: { bg: 'bg-coral-500/15', text: 'text-coral-400', dot: 'bg-coral-400', label: t('tables.occupied'), gradient: 'from-coral-400 to-rose-500' },
    reserved: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400', label: t('tables.reserved'), gradient: 'from-amber-400 to-orange-500' },
    'in-service': { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400', label: t('tables.inService'), gradient: 'from-blue-400 to-indigo-500' },
  };

  useEffect(() => { fetchTables(); fetchTableStatusSummary(); }, [fetchTables, fetchTableStatusSummary]);

  const zones = [...new Set(tables.map((t) => t.zone))];
  const filteredTables = selectedZone ? tables.filter((t) => t.zone === selectedZone) : tables;

  const handleTableClick = (table: TableDTO) => {
    if (table.status === 'free') navigate('/pos', { state: { selectedTable: table } });
  };

  const handleClearTable = async (tableId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await clearTable(tableId);
      addToast('success', t('common.success'));
      fetchTables();
      fetchTableStatusSummary();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsCreating(true);
    try {
      await createTable({ name: formData.name.trim(), capacity: formData.capacity, zone: formData.zone.trim() || 'Main', position: { x: 0, y: 0 } });
      setShowModal(false);
      setFormData({ name: '', capacity: 4, zone: 'Main' });
      addToast('success', t('common.success'));
      fetchTables();
      fetchTableStatusSummary();
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
          <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-sm text-surface-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{t('nav.tables')}</h1>
          <p className="text-sm text-surface-400 mt-1">{t('tables.manage')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          {t('tables.addTable')}
        </button>
      </div>

      {statusSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="card p-4 text-center">
            <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center mx-auto mb-2"><div className="w-3 h-3 bg-brand-500 rounded-full" /></div>
            <p className="text-2xl font-bold text-brand-400">{statusSummary.free}</p>
            <p className="text-xs text-surface-400 font-medium">{t('tables.free')}</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-10 h-10 bg-coral-500/10 rounded-xl flex items-center justify-center mx-auto mb-2"><div className="w-3 h-3 bg-coral-500 rounded-full" /></div>
            <p className="text-2xl font-bold text-coral-400">{statusSummary.occupied}</p>
            <p className="text-xs text-surface-400 font-medium">{t('tables.occupied')}</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center mx-auto mb-2"><div className="w-3 h-3 bg-amber-400 rounded-full" /></div>
            <p className="text-2xl font-bold text-amber-400">{statusSummary.reserved}</p>
            <p className="text-xs text-surface-400 font-medium">{t('tables.reserved')}</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center mx-auto mb-2"><div className="w-3 h-3 bg-brand-500 rounded-full" /></div>
            <p className="text-2xl font-bold text-brand-400">{statusSummary.inService}</p>
            <p className="text-xs text-surface-400 font-medium">{t('tables.inService')}</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-10 h-10 bg-surface-800 rounded-xl flex items-center justify-center mx-auto mb-2"><Table2 size={20} className="text-surface-400" /></div>
            <p className="text-2xl font-bold text-white">{statusSummary.total}</p>
            <p className="text-xs text-surface-400 font-medium">{t('tables.total')}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Filter size={16} className="text-surface-400" />
        <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="input-field w-auto">
          <option value="">{t('tables.allZones')}</option>
          {zones.map((zone) => (<option key={zone} value={zone}>{zone}</option>))}
        </select>
      </div>

      <div className="card p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredTables.map((table) => {
            const status = statusConfig[table.status] || statusConfig.free;
            return (
              <button key={table._id} onClick={() => handleTableClick(table)} disabled={table.status !== 'free'}
                className={`relative card p-4 text-center transition-all duration-200 ${table.status === 'free' ? 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-emerald-300' : 'cursor-default opacity-75'}`}>
                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r ${status.gradient}`} />
                <div className="mt-2">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-surface-800 to-surface-700 flex items-center justify-center">
                    <Table2 size={24} className="text-surface-300" />
                  </div>
                  <p className="font-bold text-white">{table.name}</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-surface-400 mt-1"><Users size={12} /><span>{table.capacity}</span></div>
                  <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
                {table.status !== 'free' && (
                  <button onClick={(e) => handleClearTable(table._id, e)} className="absolute top-3 right-3 p-1.5 rounded-lg bg-surface-900/80 hover:bg-surface-800 text-coral-400 hover:text-coral-500 transition-all shadow-sm" title={t('tables.clearTable')}>
                    <Trash2 size={14} />
                  </button>
                )}
              </button>
            );
          })}
        </div>
        {filteredTables.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-4"><Table2 size={32} className="text-surface-400" /></div>
            <p className="text-surface-400 font-medium">{t('tables.noTables')}</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md card p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-display font-bold text-white">{t('tables.createTable')}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/5 text-surface-400 hover:text-surface-300 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('tables.tableName')} *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required autoFocus className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('tables.capacity')} *</label>
                  <input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })} min="1" required className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('tables.zone')} *</label>
                  <input type="text" value={formData.zone} onChange={(e) => setFormData({ ...formData, zone: e.target.value })} required className="input-field" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">{t('common.cancel')}</button>
                <button type="submit" disabled={isCreating || !formData.name.trim()} className="btn-primary">
                  {isCreating ? t('tables.creating') : t('tables.createTable')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
