import { Request, Response } from 'express';
import { KitchenService } from './kitchen.service';
import { OrderService } from '../orders/order.service';
import { sendSuccess, AppError } from '../../utils/response';

export class KitchenController {
  static async getQueue(req: Request, res: Response): Promise<void> {
    try {
      const { status, priority } = req.query;
      const queue = await KitchenService.getQueue({
        status: status as 'pending' | 'preparing' | 'ready' | undefined,
        priority: priority ? parseInt(priority as string) : undefined,
      });
      sendSuccess(res, queue);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          data: null,
          error: { code: error.code, message: error.message },
          meta: null,
        });
      } else {
        res.status(500).json({
          success: false,
          data: null,
          error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
          meta: null,
        });
      }
    }
  }

  static async getPriorityQueue(_req: Request, res: Response): Promise<void> {
    try {
      const queue = await KitchenService.getPriorityQueue();
      sendSuccess(res, queue);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          data: null,
          error: { code: error.code, message: error.message },
          meta: null,
        });
      } else {
        res.status(500).json({
          success: false,
          data: null,
          error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
          meta: null,
        });
      }
    }
  }

  static async startPreparation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const entry = await KitchenService.startPreparation(id);
      sendSuccess(res, entry);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          data: null,
          error: { code: error.code, message: error.message },
          meta: null,
        });
      } else {
        res.status(500).json({
          success: false,
          data: null,
          error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
          meta: null,
        });
      }
    }
  }

  static async markReady(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const entry = await KitchenService.markReady(id);
      sendSuccess(res, entry);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          data: null,
          error: { code: error.code, message: error.message },
          meta: null,
        });
      } else {
        res.status(500).json({
          success: false,
          data: null,
          error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
          meta: null,
        });
      }
    }
  }

  static async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      await OrderService.cancelOrder(id, reason);
      sendSuccess(res, { message: 'Order cancelled successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          data: null,
          error: { code: error.code, message: error.message },
          meta: null,
        });
      } else {
        res.status(500).json({
          success: false,
          data: null,
          error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
          meta: null,
        });
      }
    }
  }
}
