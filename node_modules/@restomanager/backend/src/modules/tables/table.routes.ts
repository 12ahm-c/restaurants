import { Router } from 'express';
import { TableController } from './table.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';

const router = Router();

router.get('/tables/status', authenticate, TableController.getTableStatusSummary);
router.get('/tables', authenticate, TableController.getTables);
router.get('/tables/:id', authenticate, TableController.getTableById);
router.patch('/tables/:id/status', authenticate, TableController.updateTableStatus);
router.patch('/tables/:id/clear', authenticate, TableController.clearTable);
router.post('/tables', authenticate, requireRole('owner', 'manager'), TableController.createTable);

export default router;
