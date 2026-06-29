import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  prepTime: z.number().min(0, 'Prep time must be positive').optional(),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  recipe: z
    .array(
      z.object({
        inventoryId: z.string().min(1, 'Inventory item is required'),
        quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
      })
    )
    .optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  sortOrder: z.number().min(0, 'Sort order must be non-negative').optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;

export function validateProduct(data: unknown): {
  success: boolean;
  errors?: Record<string, string>;
  data?: ProductFormData;
} {
  const result = productSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((err) => {
    const field = err.path.join('.');
    errors[field] = err.message;
  });

  return { success: false, errors };
}

export function validateCategory(data: unknown): {
  success: boolean;
  errors?: Record<string, string>;
  data?: CategoryFormData;
} {
  const result = categorySchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((err) => {
    const field = err.path.join('.');
    errors[field] = err.message;
  });

  return { success: false, errors };
}
