import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { CustomerService } from './customer.service';
import { sendSuccess, sendError, AppError } from '../../utils/response';

const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().max(50).optional(),
  phone: z.string().min(1, 'Phone is required').max(20),
  email: z.string().email().optional(),
  address: z.string().max(200).optional(),
  preferences: z.string().max(500).optional(),
  birthDate: z.string().optional(),
  branchId: z.string().optional(),
});

const updateCustomerSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().min(1).max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().max(200).optional(),
  preferences: z.string().max(500).optional(),
  birthDate: z.string().optional(),
});

const redeemLoyaltySchema = z.object({
  points: z.number().min(1, 'Points must be positive'),
  orderId: z.string().min(1, 'Order ID is required'),
});

function handleError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message);
    return;
  }
  if (error instanceof mongoose.Error.ValidationError) {
    const fields = Object.fromEntries(
      Object.entries(error.errors).map(([field, value]) => [field, value.message])
    );
    sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
    return;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  ) {
    sendError(res, 409, 'DUPLICATE', 'Duplicate value already exists');
    return;
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}

export class CustomerController {
  static async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      const result = await CustomerService.getCustomers(req.query as any);
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

  static async getCustomerById(req: Request, res: Response): Promise<void> {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      sendSuccess(res, customer);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async createCustomer(req: Request, res: Response): Promise<void> {
    const result = createCustomerSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.issues.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const customer = await CustomerService.createCustomer(result.data);
      sendSuccess(res, customer, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async updateCustomer(req: Request, res: Response): Promise<void> {
    const result = updateCustomerSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.issues.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const customer = await CustomerService.updateCustomer(req.params.id, result.data);
      sendSuccess(res, customer);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async searchCustomers(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      if (!q || (q as string).length < 2) {
        sendSuccess(res, []);
        return;
      }

      const customers = await CustomerService.searchCustomers(q as string);
      sendSuccess(res, customers);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async redeemLoyaltyPoints(req: Request, res: Response): Promise<void> {
    const result = redeemLoyaltySchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.issues.forEach((e) => {
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

      const redemption = await CustomerService.redeemLoyaltyPoints(
        req.params.id,
        result.data.points,
        result.data.orderId,
        userId
      );
      sendSuccess(res, redemption);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getCustomerLoyaltyHistory(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = req.query;
      const result = await CustomerService.getCustomerLoyaltyHistory(req.params.id, {
        page: page as string,
        limit: limit as string,
      });
      sendSuccess(res, result.transactions, 200, {
        page: parseInt(page as string || '1', 10),
        limit: parseInt(limit as string || '20', 10),
        total: result.total,
        hasMore: parseInt(page as string || '1', 10) * parseInt(limit as string || '20', 10) < result.total,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getCustomerPurchaseHistory(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = req.query;
      const result = await CustomerService.getCustomerPurchaseHistory(req.params.id, {
        page: page as string,
        limit: limit as string,
      });
      sendSuccess(res, result.orders, 200, {
        page: parseInt(page as string || '1', 10),
        limit: parseInt(limit as string || '20', 10),
        total: result.total,
        hasMore: parseInt(page as string || '1', 10) * parseInt(limit as string || '20', 10) < result.total,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getLoyaltyRanking(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const ranking = await CustomerService.getLoyaltyRanking(
        limit ? parseInt(limit as string, 10) : 20
      );
      sendSuccess(res, ranking);
    } catch (error) {
      handleError(res, error);
    }
  }
}
