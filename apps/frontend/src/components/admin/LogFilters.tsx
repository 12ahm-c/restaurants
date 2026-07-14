import React from 'react';

interface LogFiltersProps {
  filters: {
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

export const LogFilters: React.FC<LogFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  return (
    <div className="bg-surface-900 rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1">User ID</label>
          <input
            type="text"
            value={filters.userId || ''}
            onChange={(e) => onFilterChange('userId', e.target.value)}
            className="w-full border border-white/10 bg-surface-800 rounded px-3 py-2 text-sm text-white"
            placeholder="Filter by user ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1">Action</label>
          <select
            value={filters.action || ''}
            onChange={(e) => onFilterChange('action', e.target.value)}
            className="w-full border border-white/10 bg-surface-800 rounded px-3 py-2 text-sm text-white"
          >
            <option value="">All actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1">From</label>
          <input
            type="date"
            value={filters.from || ''}
            onChange={(e) => onFilterChange('from', e.target.value)}
            className="w-full border border-white/10 bg-surface-800 rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1">To</label>
          <input
            type="date"
            value={filters.to || ''}
            onChange={(e) => onFilterChange('to', e.target.value)}
            className="w-full border border-white/10 bg-surface-800 rounded px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
      <button
        onClick={onClearFilters}
        className="mt-3 text-sm text-brand-400 hover:text-brand-500"
      >
        Clear filters
      </button>
    </div>
  );
};
