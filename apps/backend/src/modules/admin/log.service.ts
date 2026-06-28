import { Log, ILog } from '../../models/Log';
import mongoose from 'mongoose';

export interface LogFilters {
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

export class LogService {
  static async getLogs(filters: LogFilters): Promise<{ logs: ILog[]; nextCursor: string | null; hasMore: boolean }> {
    const { userId, action, from, to, cursor, limit = 50 } = filters;
    const query: any = {};

    if (userId) {
      query.userId = new mongoose.Types.ObjectId(userId);
    }
    if (action) {
      query.action = action;
    }
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }
    if (cursor) {
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const logs = await Log.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('userId', 'name email');

    const hasMore = logs.length > limit;
    const slicedLogs = hasMore ? logs.slice(0, limit) : logs;
    const nextCursor = hasMore ? slicedLogs[slicedLogs.length - 1]._id.toString() : null;

    return { logs: slicedLogs, nextCursor, hasMore };
  }

  static async createLog(data: {
    userId: mongoose.Types.ObjectId;
    action: string;
    entity: string;
    entityId?: mongoose.Types.ObjectId;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ILog> {
    return Log.createLog(data);
  }
}
