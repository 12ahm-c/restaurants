import { Request, Response } from 'express';
import { z } from 'zod';
import { SupplierService } from './supplier.service';
import { sendError, sendSuccess, AppError } from '../../utils/response';

const createSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

function handleError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message);
    return;
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}

export class SupplierController {
  static async getSuppliers(req: Request, res: Response): Promise<void> {
    try {
      const suppliers = await SupplierService.getSuppliers(req.query.search as string | undefined);
      sendSuccess(res, suppliers);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async createSupplier(req: Request, res: Response): Promise<void> {
    const result = createSupplierSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const supplier = await SupplierService.createSupplier(result.data);
      sendSuccess(res, supplier, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getSupplierMovements(req: Request, res: Response): Promise<void> {
    try {
      const movements = await SupplierService.getSupplierMovements(req.params.id);
      sendSuccess(res, movements);
    } catch (error) {
      handleError(res, error);
    }
  }
}
