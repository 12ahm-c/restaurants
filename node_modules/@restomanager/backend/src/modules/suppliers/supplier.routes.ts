import { Router } from 'express';
import { SupplierController } from './supplier.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';

const router = Router();

router.get('/suppliers', authenticate, SupplierController.getSuppliers);
router.get('/suppliers/:id/movements', authenticate, SupplierController.getSupplierMovements);
router.post(
  '/suppliers',
  authenticate,
  requireRole('owner', 'manager', 'stock_manager'),
  SupplierController.createSupplier
);

export default router;
