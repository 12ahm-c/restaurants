import { Request, Response } from 'express';
import { z } from 'zod';
import { OrderService } from './order.service';
import { sendSuccess, sendError, AppError } from '../../utils/response';

const createOrderSchema = z.object({
  tentId: z.string().optional(),
  customerId: z.string().optional(),
  type: z.enum(['dine-in', 'takeaway', 'delivery', 'rental']),
  paymentMethod: z.enum(['cash', 'card', 'mobile']).optional(),
  rentalDuration: z.string().optional(),
  rentalPrice: z.number().min(0).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().min(1),
        variant: z.string().optional(),
        options: z
          .array(
            z.object({
              name: z.string(),
              price: z.number(),
            })
          )
          .optional(),
        quantityTypeName: z.string().optional(),
        quantityTypeLabel: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['new', 'preparing', 'ready', 'served', 'cancelled', 'completed']),
});

function handleError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message);
    return;
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}

export class OrderController {
  static async createOrder(req: Request, res: Response): Promise<void> {
    const idempotencyKey = req.headers['idempotency-key'] as string;

    const result = createOrderSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const { order, items, kitchenQueueId } = await OrderService.createOrder(
        req.user!.sub,
        result.data
      );

      sendSuccess(res, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        tentStatus: order.tentId ? 'occupied' : 'n/a',
        kitchenQueueId,
        ticketUrl: null,
      }, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getOrders(req: Request, res: Response): Promise<void> {
    const status = req.query.status as string | undefined;
    const tableId = req.query.tableId as string | undefined;
    const customerId = req.query.customerId as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    try {
      const { orders, total } = await OrderService.getOrders({
        status: status as 'new' | 'preparing' | 'ready' | 'served' | 'cancelled' | undefined,
        tableId,
        customerId,
        from,
        to,
        page,
        limit,
      });

      sendSuccess(res, orders, 200, {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getActiveOrders(req: Request, res: Response): Promise<void> {
    try {
      const orders = await OrderService.getActiveOrders(req.user!.sub);
      sendSuccess(res, orders);
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { order, items } = await OrderService.getOrderById(req.params.id);
      sendSuccess(res, { order, items });
    } catch (error) {
      handleError(res, error);
    }
  }

  static async updateOrderStatus(req: Request, res: Response): Promise<void> {
    const result = updateStatusSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    try {
      const order = await OrderService.updateOrderStatus(req.params.id, result.data.status);
      sendSuccess(res, order);
    } catch (error) {
      handleError(res, error);
    }
  }
}
