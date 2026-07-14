import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';

const router = Router();

router.get('/me', authenticate, UserController.updateProfile);
router.patch('/me', authenticate, UserController.updateProfile);
router.post('/me/change-password', authenticate, UserController.changePassword);

router.get('/employees', authenticate, requireRole('owner', 'manager'), UserController.getEmployees);
router.post('/employees', authenticate, requireRole('owner', 'manager'), UserController.createEmployee);
router.patch('/employees/:id', authenticate, requireRole('owner', 'manager'), UserController.updateEmployee);

export default router;
