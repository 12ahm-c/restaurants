import { KitchenQueue, IKitchenQueue, KitchenStatus } from '../../models/KitchenQueue';
import { Order } from '../../models/Order';
import { Tent } from '../../models/Tent';
import { Inventory } from '../../models/Inventory';
import { OrderItem } from '../../models/OrderItem';
import { AppError } from '../../utils/response';
import { getIO } from '../../socket/socket.server';
import { emitOrderStatusUpdate } from '../../socket/emitters';
import { NotificationService } from '../notifications/notification.service';
import { logger } from '../../utils/logger';

export interface KitchenQueueDTO {
  _id: string;
  orderId: string;
  status: KitchenStatus;
  priority: number;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  order?: {
    _id: string;
    orderNumber: string;
    type: string;
    status: string;
    totalTTC: number;
    notes?: string;
    createdAt: Date;
  };
  table?: {
    _id: string;
    tentNumber: number;
    size: string;
  };
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    notes?: string;
  }>;
}

export class KitchenService {
  static async getQueue(filters?: {
    status?: KitchenStatus;
    priority?: number;
  }): Promise<KitchenQueueDTO[]> {
    const query: Record<string, unknown> = {};

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.priority !== undefined) {
      query.priority = filters.priority;
    }

    const queue = await KitchenQueue.find(query)
      .populate({
        path: 'orderId',
        select: 'orderNumber type status totalTTC notes createdAt',
          populate: {
            path: 'tentId',
            select: 'tentNumber size',
          },
      })
      .sort({ priority: -1, createdAt: 1 });

    const queueWithItems = await Promise.all(
      queue.map(async (entry) => {
        const orderData = entry.orderId as unknown as {
          _id: string;
          orderNumber: string;
          type: string;
          status: string;
          totalTTC: number;
          notes?: string;
          createdAt: Date;
          tentId?: { _id: string; tentNumber: number; size: string };
        } | null;

        if (!orderData || !orderData._id) {
          return {
            _id: entry._id.toString(),
            orderId: entry.orderId?.toString() || '',
            status: entry.status,
            priority: entry.priority,
            startTime: entry.startTime,
            endTime: entry.endTime,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            order: undefined,
            table: undefined,
            items: [],
          };
        }

        const orderItems = await OrderItem.find({ orderId: orderData._id })
          .populate('productId', 'name');

        return {
          _id: entry._id.toString(),
          orderId: orderData._id,
          status: entry.status,
          priority: entry.priority,
          startTime: entry.startTime,
          endTime: entry.endTime,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          order: {
            _id: orderData._id,
            orderNumber: orderData.orderNumber || orderData._id,
            type: orderData.type,
            status: orderData.status,
            totalTTC: orderData.totalTTC,
            notes: orderData.notes,
            createdAt: orderData.createdAt,
          },
          table: orderData.tentId
            ? {
                _id: orderData.tentId._id,
                tentNumber: orderData.tentId.tentNumber,
                size: orderData.tentId.size,
              }
            : undefined,
          items: orderItems.map((item) => ({
            productId: (item.productId as unknown as { _id: string })?._id || '',
            productName: (item.productId as unknown as { name: string })?.name || '',
            quantity: item.quantity,
            notes: item.notes,
          })),
        };
      })
    );

    return queueWithItems;
  }

  static async getPriorityQueue(): Promise<KitchenQueueDTO[]> {
    return this.getQueue({ priority: 1 });
  }

  static async startPreparation(id: string): Promise<IKitchenQueue> {
    const entry = await KitchenQueue.findById(id);

    if (!entry) {
      throw new AppError(404, 'NOT_FOUND', 'Kitchen queue entry not found');
    }

    if (entry.status !== 'pending') {
      throw new AppError(409, 'INVALID_STATE', 'Order is not in pending status');
    }

    entry.status = 'preparing';
    entry.startTime = new Date();
    await entry.save();

    const order = await Order.findByIdAndUpdate(
      entry.orderId,
      { status: 'preparing' },
      { new: true }
    ).populate('tentId', 'tentNumber size');

    if (order) {
      try {
        const io = getIO();
        const tentData = (order.tentId as unknown as { tentNumber: number; size: string }) || {};
        const sizeLabel = tentData.size === 'small' ? 'صغيرة' : tentData.size === 'large' ? 'كبيرة' : 'متوسطة';
        const tentName = tentData.tentNumber ? `خيمة ${tentData.tentNumber} - ${sizeLabel}` : 'Unknown';
        emitOrderStatusUpdate(io, {
          orderId: order._id.toString(),
          status: 'preparing',
          tentName,
          timestamp: new Date(),
        });
      } catch (socketError) {
        // ignore
      }
    }

    return entry;
  }

  static async markReady(id: string): Promise<IKitchenQueue> {
    const entry = await KitchenQueue.findById(id);

    if (!entry) {
      throw new AppError(404, 'NOT_FOUND', 'Kitchen queue entry not found');
    }

    if (entry.status !== 'preparing') {
      throw new AppError(409, 'INVALID_STATE', 'Order is not in preparing status');
    }

    entry.status = 'ready';
    entry.endTime = new Date();
    await entry.save();

    const order = await Order.findByIdAndUpdate(
      entry.orderId,
      { status: 'ready' },
      { new: true }
    ).populate('tentId', 'tentNumber size');

    if (order) {
      try {
        const io = getIO();
        const tentData = (order.tentId as unknown as { tentNumber: number; size: string }) || {};
        const sizeLabel = tentData.size === 'small' ? 'صغيرة' : tentData.size === 'large' ? 'كبيرة' : 'متوسطة';
        const tentName = tentData.tentNumber ? `خيمة ${tentData.tentNumber} - ${sizeLabel}` : 'Unknown';
        emitOrderStatusUpdate(io, {
          orderId: order._id.toString(),
          status: 'ready',
          tentName,
          timestamp: new Date(),
        });
        await NotificationService.notifyServersOrderReady(
          order._id.toString(),
          order.orderNumber || order._id.toString().slice(-6).toUpperCase(),
          tentName
        );
      } catch (socketError) {
        logger.warn({ err: socketError }, 'Failed to emit ready status or notify servers');
      }
    }

    return entry;
  }
}
