import { Router } from 'express';
import { MenuController } from './menu.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole, Role } from '../../middlewares/rbac';

const router = Router();

router.get('/menu/products', authenticate, MenuController.getProducts);
router.get('/menu/products/availability', authenticate, MenuController.getProductsAvailability);
router.get('/menu/products/:id', authenticate, MenuController.getProductById);
router.get('/menu/categories', authenticate, MenuController.getCategories);

router.post(
  '/menu/categories',
  authenticate,
  requireRole('owner' as Role, 'manager' as Role),
  MenuController.createCategory
);

router.put(
  '/menu/categories/:id',
  authenticate,
  requireRole('owner' as Role, 'manager' as Role),
  MenuController.updateCategory
);

router.delete(
  '/menu/categories/:id',
  authenticate,
  requireRole('owner' as Role, 'manager' as Role),
  MenuController.deleteCategory
);

router.post(
  '/menu/products',
  authenticate,
  requireRole('owner' as Role, 'manager' as Role),
  MenuController.createProduct
);

router.put(
  '/menu/products/:id',
  authenticate,
  requireRole('owner' as Role, 'manager' as Role),
  MenuController.updateProduct
);

router.patch(
  '/menu/products/:id/status',
  authenticate,
  requireRole('owner' as Role, 'manager' as Role, 'chef' as Role),
  MenuController.updateProductStatus
);

router.delete(
  '/menu/products/:id',
  authenticate,
  requireRole('owner' as Role, 'manager' as Role),
  MenuController.deleteProduct
);

export default router;
