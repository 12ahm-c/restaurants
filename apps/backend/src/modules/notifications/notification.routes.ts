import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/me', NotificationController.getNotifications);
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/read-all', NotificationController.markAllAsRead);

export default router;
