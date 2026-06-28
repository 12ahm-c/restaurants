import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { InventoryService } from './inventory.service';
import { sendSuccess, sendError, AppError } from '../../utils/response';

const optionalObjectIdSchema = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Invalid ObjectId')
  .optional();

const createInventorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  quantity: z.number().min(0, 'Quantity must be positive'),
  threshold: z.number().min(0, 'Threshold must be positive'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  branchId: z.string().optional(),
  supplier: z.string().optional(),
  supplierId: optionalObjectIdSchema,
  expiryDate: z.string().optional(),
});

const adjustStockSchema = z.object({
  quantity: z.number(),
  type: z.enum(['adjustment', 'replenishment', 'deduction', 'waste']),
  reason: z.string().min(1, 'Reason is required'),
});

const incrementStockSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be positive'),
  unitPrice: z.number().min(0).optional(),
  supplier: z.string().optional(),
  supplierId: optionalObjectIdSchema,
  paidSupplierPrice: z.number().min(0).optional(),
});

function handleError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message);
    return;
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}

export class InventoryController {
  static async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const result = await InventoryService.getInventoryItems(req.query as any);
      sendSuccess(res, result.items, 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        hasMore: result.page * result.limit < result.total,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getInventoryById(req: Request, res: Response): Promise<void> {
    try {
      const item = await InventoryService.getInventoryById(req.params.id);
      sendSuccess(res, item);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getStockAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { branchId } = req.query;
      const alerts = await InventoryService.getStockAlerts(branchId as string);
      sendSuccess(res, alerts);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async createInventory(req: Request, res: Response): Promise<void> {
    const result = createInventorySchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const item = await InventoryService.createInventoryItem(result.data);
      sendSuccess(res, item, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async adjustStock(req: Request, res: Response): Promise<void> {
    const result = adjustStockSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
        return;
      }

      const adjustment = await InventoryService.adjustStock(
        req.params.id,
        result.data,
        userId
      );
      sendSuccess(res, adjustment);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async incrementStock(req: Request, res: Response): Promise<void> {
    const result = incrementStockSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
        return;
      }

      const adjustment = await InventoryService.incrementStock(
        req.params.id,
        result.data.quantity,
        userId,
        result.data.unitPrice,
        result.data.supplier,
        result.data.supplierId,
        result.data.paidSupplierPrice
      );
      sendSuccess(res, adjustment);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getStockValue(req: Request, res: Response): Promise<void> {
    try {
      const { branchId } = req.query;
      const result = await InventoryService.getStockValue(branchId as string);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getStockMovements(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = req.query;
      const result = await InventoryService.getStockMovements(req.params.id, {
        page: page as string,
        limit: limit as string,
      });
      sendSuccess(res, result.movements, 200, {
        page: parseInt(page as string || '1', 10),
        limit: parseInt(limit as string || '20', 10),
        total: result.total,
        hasMore: parseInt(page as string || '1', 10) * parseInt(limit as string || '20', 10) < result.total,
      });
    } catch (error) {
      handleError(res, error);
    }
  }
}
