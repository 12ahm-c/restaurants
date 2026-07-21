import { Request, Response } from 'express';
import { z } from 'zod';
import { TentService } from './tent.service';
import { sendSuccess, sendError, AppError } from '../../utils/response';

const updateStatusSchema = z.object({
  status: z.enum(['free', 'occupied', 'reserved', 'cleaning']),
  serverId: z.string().optional(),
});

const createTentSchema = z.object({
  tentNumber: z.number().min(1, 'Tent number is required'),
  size: z.enum(['small', 'medium', 'large'], { required_error: 'Size is required' }),
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

export class TentController {
  static async getTents(req: Request, res: Response): Promise<void> {
    const status = req.query.status as string | undefined;
    const size = req.query.size as string | undefined;

    try {
      const tents = await TentService.getTents({
        status: status as 'free' | 'occupied' | 'reserved' | 'cleaning' | undefined,
        size: size as 'small' | 'medium' | 'large' | undefined,
      });
      sendSuccess(res, tents);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getTentStatusSummary(_req: Request, res: Response): Promise<void> {
    try {
      const summary = await TentService.getTentStatusSummary();
      sendSuccess(res, summary);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getTentById(req: Request, res: Response): Promise<void> {
    try {
      const tent = await TentService.getTentById(req.params.id);
      sendSuccess(res, tent);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async updateTentStatus(req: Request, res: Response): Promise<void> {
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
      const tent = await TentService.updateTentStatus(
        req.params.id,
        result.data.status,
        result.data.serverId
      );
      sendSuccess(res, tent);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async markTentEmpty(req: Request, res: Response): Promise<void> {
    try {
      const tent = await TentService.markTentEmpty(req.params.id);
      sendSuccess(res, tent);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async createTent(req: Request, res: Response): Promise<void> {
    const result = createTentSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const tent = await TentService.createTent(result.data);
      sendSuccess(res, tent, 201);
    } catch (error) {
      handleError(res, error);
    }
  }
}
