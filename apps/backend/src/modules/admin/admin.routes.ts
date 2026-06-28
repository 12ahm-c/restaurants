import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';

const router = Router();

router.use(authenticate);

router.get('/settings', requireRole('owner'), SettingsController.getSettings);
router.put('/settings', requireRole('owner'), SettingsController.updateSettings);

router.get('/logs', requireRole('owner'), AdminController.getLogs);

export default router;
