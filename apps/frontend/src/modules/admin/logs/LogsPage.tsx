import React, { useEffect, useState } from 'react';
import { logsService, Log, LogFilters as LogFiltersType } from '../../../services/logs.service';
import { LogFilters } from '../../../components/admin/LogFilters';

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filters, setFilters] = useState<LogFiltersType>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchLogs = async (cursor?: string) => {
    setIsLoading(true);
    try {
      const result = await logsService.getLogs({ ...filters, cursor, limit: 50 });
      if (cursor) {
        setLogs((prev) => [...prev, ...result.logs]);
      } else {
        setLogs(result.logs);
      }
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchLogs(nextCursor);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">System Logs</h1>

      <LogFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => (
              <React.Fragment key={log._id}>
                <tr
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedRow(expandedRow === log._id ? null : log._id)}
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {log.userId?.name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{log.entity}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {log.details ? 'Click to expand' : '-'}
                  </td>
                </tr>
                {expandedRow === log._id && log.details && (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 bg-gray-50">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">No logs found</div>
        )}

        {hasMore && (
          <div className="p-4 border-t">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="w-full py-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
