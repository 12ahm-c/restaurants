import { ILog } from '../../models/Log';
import mongoose from 'mongoose';
export interface LogFilters {
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
    cursor?: string;
    limit?: number;
}
export declare class LogService {
    static getLogs(filters: LogFilters): Promise<{
        logs: ILog[];
        nextCursor: string | null;
        hasMore: boolean;
    }>;
    static createLog(data: {
        userId: mongoose.Types.ObjectId;
        action: string;
        entity: string;
        entityId?: mongoose.Types.ObjectId;
        details?: Record<string, unknown>;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<ILog>;
}
//# sourceMappingURL=log.service.d.ts.map