import { Router } from 'express';
import { FinanceController } from './finance.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';

const router = Router();

router.use(authenticate);

router.get(
  '/finance/summary',
  requireRole('owner', 'manager'),
  FinanceController.getFinanceSummary
);

router.get(
  '/finance/expenses',
  requireRole('owner', 'manager'),
  FinanceController.getExpenses
);

router.post(
  '/finance/expenses',
  requireRole('owner', 'manager'),
  FinanceController.createExpense
);

router.delete(
  '/finance/expenses/:id',
  requireRole('owner', 'manager'),
  FinanceController.deleteExpense
);

export default router;
