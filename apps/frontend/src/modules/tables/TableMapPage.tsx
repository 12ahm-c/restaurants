import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTableStore } from '../../stores/tableStore';
import { useUIStore } from '../../stores/uiStore';
import { TableDTO, TableStatus } from '../../types';
import { Plus, X, Trash2, Table2, Users, Filter } from 'lucide-react';

const statusConfig: Record<TableStatus, { bg: string; text: string; dot: string; label: string; gradient: string }> = {
  free: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Free', gradient: 'from-emerald-400 to-green-500' },
  occupied: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Occupied', gradient: 'from-red-400 to-rose-500' },
  reserved: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Reserved', gradient: 'from-amber-400 to-orange-500' },
  'in-service': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'In Service', gradient: 'from-blue-400 to-indigo-500' },
};

export function TableMapPage() {
  const { tables, statusSummary, fetchTables, fetchTableStatusSummary, isLoading, createTable, clearTable } = useTableStore();
  const { addToast } = useUIStore();
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', capacity: 4, zone: 'Main' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTables();
    fetchTableStatusSummary();
  }, [fetchTables, fetchTableStatusSummary]);

  const zones = [...new Set(tables.map((t) => t.zone))];

  const filteredTables = selectedZone
    ? tables.filter((t) => t.zone === selectedZone)
    : tables;

  const handleTableClick = (table: TableDTO) => {
    if (table.status === 'free') {
      navigate('/pos', { state: { selectedTable: table } });
    }
  };

  const handleClearTable = async (tableId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await clearTable(tableId);
      addToast('success', 'Table cleared successfully');
      fetchTables();
      fetchTableStatusSummary();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to clear table');
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsCreating(true);
    try {
      await createTable({
        name: formData.name.trim(),
        capacity: formData.capacity,
        zone: formData.zone.trim() || 'Main',
        position: { x: 0, y: 0 },
      });
      setShowModal(false);
      setFormData({ name: '', capacity: 4, zone: 'Main' });
      addToast('success', 'Table created successfully');
      fetchTables();
      fetchTableStatusSummary();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to create table');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Tables</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your restaurant tables</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add Table
        </button>
      </div>

      {/* Status Summary */}
      {statusSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="card p-4 text-center">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{statusSummary.free}</p>
            <p className="text-xs text-gray-500 font-medium">Free</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <p className="text-2xl font-bold text-red-600">{statusSummary.occupied}</p>
            <p className="text-xs text-gray-500 font-medium">Occupied</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{statusSummary.reserved}</p>
            <p className="text-xs text-gray-500 font-medium">Reserved</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{statusSummary.inService}</p>
            <p className="text-xs text-gray-500 font-medium">In Service</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Table2 size={20} className="text-gray-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{statusSummary.total}</p>
            <p className="text-xs text-gray-500 font-medium">Total</p>
          </div>
        </div>
      )}

      {/* Zone Filter */}
      <div className="flex items-center gap-3">
        <Filter size={16} className="text-gray-400" />
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All Zones</option>
          {zones.map((zone) => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>
      </div>

      {/* Tables Grid */}
      <div className="card p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredTables.map((table) => {
            const status = statusConfig[table.status] || statusConfig.free;
            return (
              <button
                key={table._id}
                onClick={() => handleTableClick(table)}
                disabled={table.status !== 'free'}
                className={`relative card p-4 text-center transition-all duration-200
                  ${table.status === 'free' 
                    ? 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-emerald-300' 
                    : 'cursor-default opacity-75'
                  }`}
              >
                {/* Status indicator */}
                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r ${status.gradient}`} />
                
                <div className="mt-2">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <Table2 size={24} className="text-gray-600" />
                  </div>
                  <p className="font-bold text-gray-900">{table.name}</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1">
                    <Users size={12} />
                    <span>{table.capacity}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>

                {table.status !== 'free' && (
                  <button
                    onClick={(e) => handleClearTable(table._id, e)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/80 hover:bg-white text-red-500 hover:text-red-600 transition-all shadow-sm"
                    title="Clear Table"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </button>
            );
          })}
        </div>

        {filteredTables.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Table2 size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No tables found</p>
          </div>
        )}
      </div>

      {/* Create Table Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md card p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-display font-bold text-gray-900">Create Table</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Table Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                  className="input-field"
                  placeholder="e.g. T1, Table 5, VIP-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Capacity *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    min="1"
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Zone *</label>
                  <input
                    type="text"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    required
                    className="input-field"
                    placeholder="e.g. Main, Terrace, VIP"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !formData.name.trim()}
                  className="btn-primary"
                >
                  {isCreating ? 'Creating...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
