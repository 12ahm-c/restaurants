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
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
          <input
            type="text"
            value={filters.userId || ''}
            onChange={(e) => onFilterChange('userId', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Filter by user ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
          <select
            value={filters.action || ''}
            onChange={(e) => onFilterChange('action', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <input
            type="date"
            value={filters.from || ''}
            onChange={(e) => onFilterChange('from', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input
            type="date"
            value={filters.to || ''}
            onChange={(e) => onFilterChange('to', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>
      <button
        onClick={onClearFilters}
        className="mt-3 text-sm text-blue-600 hover:text-blue-800"
      >
        Clear filters
      </button>
    </div>
  );
};
