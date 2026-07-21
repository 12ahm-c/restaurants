import { Router } from 'express';
import { TentController } from './tent.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';

const router = Router();

router.get('/tents/status', authenticate, TentController.getTentStatusSummary);
router.get('/tents', authenticate, TentController.getTents);
router.get('/tents/:id', authenticate, TentController.getTentById);
router.patch('/tents/:id/status', authenticate, TentController.updateTentStatus);
router.patch('/tents/:id/empty', authenticate, TentController.markTentEmpty);
router.post('/tents', authenticate, requireRole('owner', 'manager'), TentController.createTent);

export default router;
