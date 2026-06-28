import { KitchenQueue, IKitchenQueue, KitchenStatus } from '../../models/KitchenQueue';
import { Order } from '../../models/Order';
import { Table } from '../../models/Table';
import { Inventory } from '../../models/Inventory';
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
    type: string;
    status: string;
    totalTTC: number;
    notes?: string;
    createdAt: Date;
  };
  table?: {
    _id: string;
    name: string;
    zone: string;
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
        select: 'type status totalTTC notes createdAt',
        populate: {
          path: 'tableId',
          select: 'name zone',
        },
      })
      .sort({ priority: -1, createdAt: 1 });

    const queueWithItems = await Promise.all(
      queue.map(async (entry) => {
        const orderData = entry.orderId as unknown as {
          _id: string;
          type: string;
          status: string;
          totalTTC: number;
          notes?: string;
          createdAt: Date;
          tableId?: { _id: string; name: string; zone: string };
        };

        const OrderItem = (await import('../../models/OrderItem')).OrderItem;
        const orderItems = await OrderItem.find({ orderId: entry.orderId })
          .populate('productId', 'name');

        return {
          _id: entry._id.toString(),
          orderId: entry.orderId.toString(),
          status: entry.status,
          priority: entry.priority,
          startTime: entry.startTime,
          endTime: entry.endTime,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          order: orderData
            ? {
                _id: orderData._id,
                type: orderData.type,
                status: orderData.status,
                totalTTC: orderData.totalTTC,
                notes: orderData.notes,
                createdAt: orderData.createdAt,
              }
            : undefined,
          table: orderData?.tableId
            ? {
                _id: orderData.tableId._id,
                name: orderData.tableId.name,
                zone: orderData.tableId.zone,
              }
            : undefined,
          items: orderItems.map((item) => ({
            productId: (item.productId as unknown as { _id: string })._id,
            productName: (item.productId as unknown as { name: string }).name,
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
    ).populate('tableId', 'name');

    if (order) {
      try {
        const io = getIO();
        const tableName = (order.tableId as unknown as { name: string })?.name || 'Unknown';
        emitOrderStatusUpdate(io, {
          orderId: order._id.toString(),
          status: 'preparing',
          tableName,
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
    ).populate('tableId', 'name');

    if (order) {
      try {
        const io = getIO();
        const tableName = (order.tableId as unknown as { name: string })?.name || 'Unknown';
        emitOrderStatusUpdate(io, {
          orderId: order._id.toString(),
          status: 'ready',
          tableName,
          timestamp: new Date(),
        });

        // Notify servers that order is ready
        await NotificationService.notifyServersOrderReady(
          order._id.toString(),
          order.orderNumber || order._id.toString().slice(-6).toUpperCase(),
          tableName
        );
      } catch (socketError) {
        logger.warn({ err: socketError }, 'Failed to emit notification');
      }
    }

    return entry;
  }

  static async cancelOrder(orderId: string, reason: string): Promise<void> {
    const session = await (await import('mongoose')).startSession();
    session.startTransaction();

    try {
      const Order = (await import('../../models/Order')).Order;
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        throw new AppError(404, 'NOT_FOUND', 'Order not found');
      }

      const cancellableStatuses = ['new', 'preparing'];
      if (!cancellableStatuses.includes(order.status)) {
        throw new AppError(
          409,
          'INVALID_STATE',
          `Cannot cancel order in ${order.status} status`
        );
      }

      const OrderItem = (await import('../../models/OrderItem')).OrderItem;
      const orderItems = await OrderItem.find({ orderId }).session(session);

      for (const item of orderItems) {
        const Product = (await import('../../models/Product')).Product;
        const product = await Product.findById(item.productId).session(session);
        if (product?.recipe) {
          for (const recipeItem of product.recipe) {
            const inventory = await Inventory.findById(recipeItem.inventoryId).session(session);
            if (inventory) {
              const restoration = recipeItem.quantity * item.quantity;
              inventory.quantity += restoration;
              await inventory.save({ session });
            }
          }
        }
      }

      await Table.findByIdAndUpdate(
        order.tableId,
        { status: 'free', currentOrderId: null },
        { session }
      );

      await KitchenQueue.findOneAndUpdate(
        { orderId },
        { status: 'ready', endTime: new Date() },
        { session }
      );

      order.status = 'cancelled';
      await order.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
