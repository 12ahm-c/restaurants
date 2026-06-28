import { Response } from 'express';
export interface ApiResponse<T = unknown> {
    success: boolean;
    data: T | null;
    error: {
        code: string;
        message: string;
        fields?: Record<string, string>;
    } | null;
    meta: {
        page?: number;
        limit?: number;
        total?: number;
        nextCursor?: string;
        hasMore?: boolean;
        unreadCount?: number;
    } | null;
}
export declare function sendSuccess<T>(res: Response, data: T, statusCode?: number, meta?: ApiResponse['meta']): void;
export declare function sendError(res: Response, statusCode: number, code: string, message: string, fields?: Record<string, string>): void;
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    fields?: Record<string, string> | undefined;
    constructor(statusCode: number, code: string, message: string, fields?: Record<string, string> | undefined);
}
//# sourceMappingURL=response.d.ts.map