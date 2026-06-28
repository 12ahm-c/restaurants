import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole, Role } from '../../middlewares/rbac';
import { idempotencyMiddleware } from '../../middlewares/idempotency';

const router = Router();

router.get('/inventory/stock-value', authenticate, requireRole('owner' as Role, 'manager' as Role), InventoryController.getStockValue);
router.get('/inventory/alerts', authenticate, requireRole('owner' as Role, 'manager' as Role), InventoryController.getStockAlerts);
router.get('/inventory/:id/movements', authenticate, InventoryController.getStockMovements);
router.get('/inventory/:id', authenticate, InventoryController.getInventoryById);
router.get('/inventory', authenticate, InventoryController.getInventory);

router.post('/inventory', authenticate, requireRole('owner' as Role, 'manager' as Role), InventoryController.createInventory);
router.patch('/inventory/:id/adjust', authenticate, requireRole('owner' as Role, 'manager' as Role, 'stock_manager' as Role), idempotencyMiddleware, InventoryController.adjustStock);
router.patch('/inventory/:id/increment', authenticate, requireRole('owner' as Role, 'manager' as Role, 'stock_manager' as Role), InventoryController.incrementStock);

export default router;
