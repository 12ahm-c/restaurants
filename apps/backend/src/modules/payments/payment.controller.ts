import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { sendSuccess, sendError } from '../../utils/response';

export class PaymentController {
  static async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, amount, method, cashGiven } = req.body;
      const userId = (req as any).user._id;

      const result = await PaymentService.processPayment({
        orderId,
        amount,
        method,
        cashGiven,
        userId,
      });

      res.status(201).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Failed to process payment' });
    }
  }

  static async getCashDrawer(req: Request, res: Response): Promise<void> {
    try {
      const { branchId } = req.query;
      const drawer = await PaymentService.getCashDrawer(branchId as string);

      if (!drawer) {
        res.status(404).json({ message: 'No open cash drawer found' });
        return;
      }

      res.json(drawer);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get cash drawer' });
    }
  }

  static async openCashDrawer(req: Request, res: Response): Promise<void> {
    try {
      const { branchId, openingBalance } = req.body;
      const userId = (req as any).user._id;

      const drawer = await PaymentService.openCashDrawer(branchId, openingBalance, userId);
      res.status(201).json(drawer);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Failed to open cash drawer' });
    }
  }

  static async closeCashDrawer(req: Request, res: Response): Promise<void> {
    try {
      const { drawerId, declaredBalance } = req.body;
      const userId = (req as any).user._id;

      const result = await PaymentService.closeCashDrawer(drawerId, declaredBalance, userId);
      res.json(result);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Failed to close cash drawer' });
    }
  }

  static async getPaymentsByOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const payments = await PaymentService.getPaymentsByOrder(orderId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get payments' });
    }
  }

  static async getAllPayments(req: Request, res: Response): Promise<void> {
    try {
      const { method, status, from, to, page, limit } = req.query;
      const result = await PaymentService.getAllPayments({
        method: method as any,
        status: status as string,
        from: from as string,
        to: to as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      });
      sendSuccess(res, result.payments, 200, {
        page: 1,
        limit: result.payments.length,
        total: result.total,
        hasMore: false,
      });
    } catch (error: any) {
      sendError(res, 500, 'INTERNAL_ERROR', error.message || 'Failed to get payments');
    }
  }

  static async refundPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const payment = await PaymentService.refundPayment(paymentId);
      res.json(payment);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Failed to refund payment' });
    }
  }
}
