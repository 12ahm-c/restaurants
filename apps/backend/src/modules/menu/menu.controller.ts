import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { MenuService } from './menu.service';
import { sendSuccess, sendError, AppError } from '../../utils/response';

const optionalObjectIdSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z
    .string()
    .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Invalid ObjectId')
    .optional()
);

const getProductsSchema = z.object({
  categoryId: optionalObjectIdSchema,
  status: z.enum(['available', 'unavailable', 'discontinued']).optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['name', 'price', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be positive'),
  prepTime: z.number().min(0).optional(),
  imageUrl: z.string().optional(),
  recipe: z
    .array(
      z.object({
        inventoryId: z.string(),
        quantity: z.number().min(0.01),
      })
    )
    .optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  categoryId: z.string().optional(),
  price: z.number().min(0).optional(),
  prepTime: z.number().min(0).optional(),
  status: z.enum(['available', 'unavailable', 'discontinued']).optional(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().optional(),
  recipe: z
    .array(
      z.object({
        inventoryId: z.string(),
        quantity: z.number().min(0.01),
      })
    )
    .optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  sortOrder: z.number().min(0).optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  sortOrder: z.number().min(0).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['available', 'unavailable']),
});

function handleError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message);
    return;
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}

export class MenuController {
  static async getProducts(req: Request, res: Response): Promise<void> {
    const result = getProductsSchema.safeParse(req.query);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const { products, total } = await MenuService.getProducts(result.data);
      sendSuccess(res, products, 200, {
        page: result.data.page || 1,
        limit: result.data.limit || 20,
        total,
        hasMore: (result.data.page || 1) * (result.data.limit || 20) < total,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const result = await MenuService.getProductById(req.params.id);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await MenuService.getCategories();
      sendSuccess(res, categories);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async createCategory(req: Request, res: Response): Promise<void> {
    const result = createCategorySchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const category = await MenuService.createCategory(result.data);
      sendSuccess(res, category, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async updateCategory(req: Request, res: Response): Promise<void> {
    const result = updateCategorySchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const category = await MenuService.updateCategory(req.params.id, result.data);
      sendSuccess(res, category);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      await MenuService.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  }

static async createProduct(req: Request, res: Response): Promise<void> {
  const result = createProductSchema.safeParse(req.body);

  if (!result.success) {
    const fields: Record<string, string> = {};
    result.error.errors.forEach((e) => {
      fields[e.path.join('.')] = e.message;
    });
    const message = Object.values(fields).join(', ');
    sendError(res, 400, 'VALIDATION_ERROR', message || 'Validation failed', fields);
    return;
  }

    try {
      const product = await MenuService.createProduct(result.data);
      sendSuccess(res, product, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async updateProduct(req: Request, res: Response): Promise<void> {
    const result = updateProductSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const product = await MenuService.updateProduct(req.params.id, result.data);
      sendSuccess(res, product);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async updateProductStatus(req: Request, res: Response): Promise<void> {
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
      const product = await MenuService.updateProductStatus(req.params.id, result.data.status);
      sendSuccess(res, product);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      await MenuService.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getProductsAvailability(_req: Request, res: Response): Promise<void> {
    try {
      const availability = await MenuService.getProductsAvailability();
      sendSuccess(res, availability);
    } catch (error) {
      handleError(res, error);
    }
  }
}
