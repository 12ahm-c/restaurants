import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';
import { healthService } from '../modules/health/health.service';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  healthService.incrementErrors();
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.fields);
    return;
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    err.errors.forEach((e) => {
      const field = e.path.join('.');
      fields[field] = e.message;
    });
    sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
    return;
  }

  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}
