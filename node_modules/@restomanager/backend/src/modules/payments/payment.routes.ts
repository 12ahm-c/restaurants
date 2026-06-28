import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { idempotencyMiddleware } from '../../middlewares/idempotency';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireRole('cashier', 'manager', 'owner'),
  PaymentController.getAllPayments
);

router.post(
  '/',
  requireRole('cashier', 'manager', 'owner'),
  idempotencyMiddleware,
  PaymentController.processPayment
);

router.get(
  '/order/:orderId',
  requireRole('cashier', 'manager', 'owner'),
  PaymentController.getPaymentsByOrder
);

router.post(
  '/:paymentId/refund',
  requireRole('manager', 'owner'),
  PaymentController.refundPayment
);

export default router;
