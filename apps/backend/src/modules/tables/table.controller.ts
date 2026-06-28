import { Request, Response } from 'express';
import { z } from 'zod';
import { TableService } from './table.service';
import { sendSuccess, sendError, AppError } from '../../utils/response';

const updateStatusSchema = z.object({
  status: z.enum(['free', 'occupied', 'reserved', 'in-service']),
  serverId: z.string().optional(),
});

const createTableSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  zone: z.string().min(1, 'Zone is required'),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

function handleError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message);
    return;
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}

export class TableController {
  static async getTables(req: Request, res: Response): Promise<void> {
    const status = req.query.status as string | undefined;
    const zone = req.query.zone as string | undefined;

    try {
      const tables = await TableService.getTables({
        status: status as 'free' | 'occupied' | 'reserved' | 'in-service' | undefined,
        zone,
      });
      sendSuccess(res, tables);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getTableStatusSummary(_req: Request, res: Response): Promise<void> {
    try {
      const summary = await TableService.getTableStatusSummary();
      sendSuccess(res, summary);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getTableById(req: Request, res: Response): Promise<void> {
    try {
      const table = await TableService.getTableById(req.params.id);
      sendSuccess(res, table);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async updateTableStatus(req: Request, res: Response): Promise<void> {
    const result = updateStatusSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const table = await TableService.updateTableStatus(
        req.params.id,
        result.data.status,
        result.data.serverId
      );
      sendSuccess(res, table);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async clearTable(req: Request, res: Response): Promise<void> {
    try {
      const table = await TableService.clearTable(req.params.id);
      sendSuccess(res, table);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async createTable(req: Request, res: Response): Promise<void> {
    const result = createTableSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const table = await TableService.createTable(result.data);
      sendSuccess(res, table, 201);
    } catch (error) {
      handleError(res, error);
    }
  }
}
