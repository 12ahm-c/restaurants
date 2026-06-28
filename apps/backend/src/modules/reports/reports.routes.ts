import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';

const router = Router();

router.use(authenticate);

router.get(
  '/sales',
  requireRole('manager', 'owner'),
  ReportsController.getSalesReport
);

router.get(
  '/profitability',
  requireRole('owner'),
  ReportsController.getProfitabilityReport
);

router.get(
  '/stock-usage',
  requireRole('stock_manager', 'manager', 'owner'),
  ReportsController.getStockUsageReport
);

export default router;
