import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { env } from './config/env';
import { connectMongoDB } from './config/db';
import { redis } from './config/redis';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { initSocketIO } from './socket/socket.server';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import tentRoutes from './modules/tents/tent.routes';
import menuRoutes from './modules/menu/menu.routes';
import orderRoutes from './modules/orders/order.routes';
import kitchenRoutes from './modules/kitchen/kitchen.routes';
import customerRoutes from './modules/customer/customer.routes';
import paymentRoutes from './modules/payments/payment.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import reportsRoutes from './modules/reports/reports.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import supplierRoutes from './modules/suppliers/supplier.routes';
import adminRoutes from './modules/admin/admin.routes';
import healthRoutes from './modules/health/health.routes';
import financeRoutes from './modules/finance/finance.routes';
import { healthService } from './modules/health/health.service';

const app = express();
const httpServer = createServer(app);

const io = initSocketIO(httpServer);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static('uploads'));

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Request counting middleware
app.use((_req, _res, next) => {
  healthService.incrementRequests();
  next();
});

app.use(healthRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/v1/auth', authRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/admin', userRoutes);
app.use('/v1', tentRoutes);
app.use('/v1', menuRoutes);
app.use('/v1', orderRoutes);
app.use('/v1', kitchenRoutes);
app.use('/v1', customerRoutes);
app.use('/v1/payments', paymentRoutes);
app.use('/v1/dashboard', dashboardRoutes);
app.use('/v1/reports', reportsRoutes);
app.use('/v1/notifications', notificationRoutes);
app.use('/v1', supplierRoutes);
app.use('/v1/admin', adminRoutes);
app.use('/v1', financeRoutes);

app.use(errorHandler);

async function start() {
  try {
    await connectMongoDB();
    logger.info('MongoDB connected');

    httpServer.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
    });
  } catch (error: unknown) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

start();

export { io };
export default app;
