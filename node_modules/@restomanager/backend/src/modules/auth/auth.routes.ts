import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middlewares/auth';
import { env } from '../../config/env';
import { User } from '../../models/User';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_MAX,
  message: {
    success: false,
    data: null,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later',
    },
    meta: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Setup: Create first admin user (only if no users exist)
router.post('/setup', async (_req, res) => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      res.status(400).json({
        success: false,
        data: null,
        error: { code: 'USERS_EXIST', message: 'Users already exist. Use login instead.' },
        meta: null,
      });
      return;
    }

    const user = await User.create({
      name: 'Admin',
      email: 'admin@restomanager.com',
      passwordHash: 'admin123',
      role: 'owner',
      isActive: true,
      language: 'fr',
    });

    res.status(201).json({
      success: true,
      data: { message: 'Admin user created', email: 'admin@restomanager.com' },
      error: null,
      meta: null,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SETUP_ERROR', message: error.message },
      meta: null,
    });
  }
});

router.post('/login', loginLimiter, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
