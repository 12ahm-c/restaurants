import { Request, Response } from 'express';
import { z } from 'zod';
import { UserService } from './user.service';
import { sendSuccess, sendError, AppError } from '../../utils/response';

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  language: z.enum(['fr', 'en', 'ar']).optional(),
});

const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['owner', 'manager', 'cashier', 'server', 'chef', 'stock_manager']),
});

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['owner', 'manager', 'cashier', 'server', 'chef', 'stock_manager']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

function handleError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message);
    return;
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}

export class UserController {
  static async updateProfile(req: Request, res: Response): Promise<void> {
    const result = updateProfileSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const user = await UserService.updateProfile(req.user!.sub, result.data);
      sendSuccess(res, user);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getEmployees(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const role = req.query.role as string | undefined;

    try {
      const { employees, total } = await UserService.getEmployees(page, limit, {
        isActive,
        role: role as 'owner' | 'manager' | 'cashier' | 'server' | 'chef' | 'stock_manager' | undefined,
      });

      sendSuccess(res, employees, 200, {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  static async createEmployee(req: Request, res: Response): Promise<void> {
    const result = createEmployeeSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const employee = await UserService.createEmployee(result.data, req.user!.sub);
      sendSuccess(res, employee, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async updateEmployee(req: Request, res: Response): Promise<void> {
    const result = updateEmployeeSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const employee = await UserService.updateEmployee(req.params.id, result.data, req.user!.sub);
      sendSuccess(res, employee);
    } catch (error) {
      handleError(res, error);
    }
  }
}
