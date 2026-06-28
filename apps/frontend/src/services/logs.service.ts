import { apiClient } from './api-client';

export interface Log {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface LogsResponse {
  logs: Log[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface LogFilters {
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

export const logsService = {
  async getLogs(filters: LogFilters = {}): Promise<LogsResponse> {
    const response = await apiClient.get('/admin/logs', { params: filters });
    return {
      logs: response.data.data,
      nextCursor: response.data.nextCursor,
      hasMore: response.data.hasMore,
    };
  },
};
