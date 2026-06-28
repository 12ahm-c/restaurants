import { Router } from 'express';
import { OrderController } from './order.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';

const router = Router();

router.post('/orders', authenticate, OrderController.createOrder);
router.get('/orders/active', authenticate, OrderController.getActiveOrders);
router.get('/orders', authenticate, OrderController.getOrders);
router.get('/orders/:id', authenticate, OrderController.getOrderById);
router.patch('/orders/:id/status', authenticate, OrderController.updateOrderStatus);

export default router;
