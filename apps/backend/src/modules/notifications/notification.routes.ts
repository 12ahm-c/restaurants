import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/me', NotificationController.getNotifications);
router.patch('/read-all', NotificationController.markAllAsRead);
router.post('/token', NotificationController.registerFcmToken);
router.delete('/token', NotificationController.unregisterFcmToken);
router.patch('/:id/read', NotificationController.markAsRead);

export default router;
