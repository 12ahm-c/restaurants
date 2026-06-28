import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';

const router = Router();

router.use(authenticate);

router.get(
  '/employee',
  DashboardController.getEmployeeDashboard
);

router.get(
  '/manager',
  requireRole('manager', 'owner'),
  DashboardController.getManagerDashboard
);

export default router;
