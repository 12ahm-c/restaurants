import { Request, Response } from 'express';
import { z } from 'zod';
import { FinanceService } from './finance.service';
import { sendSuccess, sendError, AppError } from '../../utils/response';

const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  category: z.enum(['salary', 'rent', 'electricity', 'water', 'gas', 'internet', 'maintenance', 'supplies', 'marketing', 'insurance', 'tax', 'other']),
  vendor: z.string().optional(),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'check']).optional(),
  notes: z.string().optional(),
  branchId: z.string().optional(),
  date: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringPeriod: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
});

function handleError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message);
    return;
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}

export class FinanceController {
  static async createExpense(req: Request, res: Response): Promise<void> {
    const result = createExpenseSchema.safeParse(req.body);
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

      const expense = await FinanceService.createExpense({
        ...result.data,
        userId,
      });
      sendSuccess(res, expense, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getExpenses(req: Request, res: Response): Promise<void> {
    const { category, from, to, page, limit } = req.query;
    try {
      const result = await FinanceService.getExpenses({
        category: category as any,
        from: from as string,
        to: to as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      });
      sendSuccess(res, result.expenses, 200, {
        page: 1,
        limit: result.expenses.length,
        total: result.total,
        hasMore: false,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  static async deleteExpense(req: Request, res: Response): Promise<void> {
    try {
      await FinanceService.deleteExpense(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getFinanceSummary(req: Request, res: Response): Promise<void> {
    const { from, to } = req.query;
    try {
      const summary = await FinanceService.getFinanceSummary({
        from: from as string,
        to: to as string,
      });
      sendSuccess(res, summary);
    } catch (error) {
      handleError(res, error);
    }
  }
}
