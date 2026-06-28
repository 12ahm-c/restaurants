import { Request, Response } from 'express';
import { healthService } from './health.service';
import { sendSuccess } from '../../utils/response';

export const healthController = {
  async check(_req: Request, res: Response) {
    const status = await healthService.check();
    const statusCode = status.status === 'healthy' ? 200 : status.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(status);
  },

  async metrics(_req: Request, res: Response) {
    const metrics = healthService.getMetrics();
    sendSuccess(res, metrics);
  },
};
