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

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200, meta?: ApiResponse['meta']): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    meta: meta || null,
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  fields?: Record<string, string>
): void {
  const response: ApiResponse = {
    success: false,
    data: null,
    error: {
      code,
      message,
      fields,
    },
    meta: null,
  };
  res.status(statusCode).json(response);
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'AppError';
  }
}
