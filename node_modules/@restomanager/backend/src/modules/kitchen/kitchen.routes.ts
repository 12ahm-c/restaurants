import { Router } from 'express';
import { KitchenController } from './kitchen.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole, Role } from '../../middlewares/rbac';

const router = Router();

router.get(
  '/kitchen/queue',
  authenticate,
  requireRole('chef' as Role, 'manager' as Role, 'owner' as Role),
  KitchenController.getQueue
);

router.get(
  '/kitchen/queue/priority',
  authenticate,
  requireRole('chef' as Role, 'manager' as Role, 'owner' as Role),
  KitchenController.getPriorityQueue
);

router.patch(
  '/kitchen/queue/:id/start',
  authenticate,
  requireRole('chef' as Role, 'manager' as Role, 'owner' as Role),
  KitchenController.startPreparation
);

router.patch(
  '/kitchen/queue/:id/ready',
  authenticate,
  requireRole('chef' as Role, 'manager' as Role, 'owner' as Role),
  KitchenController.markReady
);

router.post(
  '/orders/:id/cancel',
  authenticate,
  requireRole('manager' as Role, 'owner' as Role),
  KitchenController.cancelOrder
);

export default router;
