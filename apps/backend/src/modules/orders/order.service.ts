import mongoose from 'mongoose';
import { Order, IOrder, OrderStatus } from '../../models/Order';
import { OrderItem, IOrderItem } from '../../models/OrderItem';
import { Tent } from '../../models/Tent';
import { Product } from '../../models/Product';
import { Inventory, IInventory } from '../../models/Inventory';
import { KitchenQueue } from '../../models/KitchenQueue';
import { Payment } from '../../models/Payment';
import { AppError } from '../../utils/response';
import { getIO } from '../../socket/socket.server';
import { emitNewOrder, emitOrderStatusUpdate, emitOrderCancelled } from '../../socket/emitters';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationService } from '../notifications/notification.service';
import { logger } from '../../utils/logger';

export interface CreateOrderInput {
  tentId?: string;
  customerId?: string;
  type: 'dine-in' | 'takeaway' | 'delivery' | 'rental';
  paymentMethod?: 'cash' | 'card' | 'mobile';
  rentalDuration?: string;
  rentalPrice?: number;
  items?: Array<{
    productId: string;
    quantity: number;
    variant?: string;
    options?: Array<{ name: string; price: number }>;
    quantityTypeName?: string;
    quantityTypeLabel?: string;
    notes?: string;
  }>;
  notes?: string;
}

export class OrderService {
  static async createOrder(userId: string, input: CreateOrderInput): Promise<{
    order: IOrder;
    items: IOrderItem[];
    kitchenQueueId: string;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate tent requirements based on order type
      if (input.type === 'dine-in' && !input.tentId) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Tent is required for dine-in orders');
      }
      if (input.type === 'rental' && !input.tentId) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Tent is required for rental orders');
      }

      let tent: any = null;
      if (input.tentId) {
        tent = await Tent.findById(input.tentId).session(session);
        if (!tent) {
          throw new AppError(404, 'NOT_FOUND', 'Tent not found');
        }
        if (tent.status === 'occupied') {
          throw new AppError(409, 'TENT_OCCUPIED', 'Tent is already occupied');
        }
      }

      const orderItems: IOrderItem[] = [];
      let totalHT = 0;

      // For rental-only orders, totalHT is just the rental price
      if (input.type === 'rental') {
        totalHT = input.rentalPrice || 0;
      }

      for (const item of (input.items || [])) {
        const product = await Product.findById(item.productId).session(session);
        if (!product) {
          throw new AppError(404, 'NOT_FOUND', `Product ${item.productId} not found`);
        }

        if (product.status !== 'available') {
          throw new AppError(422, 'INVALID_STATE', `Product ${product.name} is not available`);
        }

        // Calculate price based on quantity type or regular price
        let unitPrice = product.price;
        if (item.quantityTypeName && product.hasQuantityTypes) {
          const qtyType = product.quantityTypes.find((qt) => qt.name === item.quantityTypeName);
          if (qtyType) {
            unitPrice = qtyType.price;
          }
        }

        const optionsTotal = item.options?.reduce((sum, opt) => sum + opt.price, 0) || 0;
        const itemTotal = (unitPrice + optionsTotal) * item.quantity;
        totalHT += itemTotal;

        orderItems.push({
          orderId: new mongoose.Types.ObjectId(),
          productId: product._id,
          variant: item.variant,
          quantity: item.quantity,
          unitPrice,
          options: item.options || [],
          quantityTypeName: item.quantityTypeName,
          quantityTypeLabel: item.quantityTypeLabel,
          notes: item.notes,
          total: itemTotal,
        } as IOrderItem);
      }

      const taxRate = 0;
      const totalTTC = totalHT * (1 + taxRate);
      const changedInventoryItems: IInventory[] = [];

      // Generate order number: ORD-YYYYMMDD-XXXX
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const countToday = await Order.countDocuments({
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      });
      const orderNumber = `ORD-${dateStr}-${String(countToday + 1).padStart(4, '0')}`;

      const order = new Order({
        orderNumber,
        tentId: input.tentId || undefined,
        customerId: input.customerId,
        userId,
        type: input.type,
        status: 'new',
        totalHT,
        totalTTC,
        rentalDuration: input.rentalDuration,
        rentalPrice: input.rentalPrice,
        notes: input.notes,
      });

      await order.save({ session });

      for (const item of orderItems) {
        item.orderId = order._id;
        await OrderItem.create([item], { session });
      }

      for (const item of (input.items || [])) {
        const product = await Product.findById(item.productId).session(session);
        if (product?.recipe) {
          for (const recipeItem of product.recipe) {
            const inventory = await Inventory.findById(recipeItem.inventoryId).session(session);
            if (inventory) {
              const deduction = recipeItem.quantity * item.quantity;
              if (inventory.quantity < deduction) {
                throw new AppError(
                  422,
                  'INSUFFICIENT_STOCK',
                  `Insufficient stock for ${inventory.name}`
                );
              }
              inventory.quantity -= deduction;
              await inventory.save({ session });
              changedInventoryItems.push(inventory);
            }
          }
        }
      }

      // Update tent status for dine-in and rental orders
      if (tent) {
        tent.status = 'occupied';
        tent.currentOrderId = order._id;
        tent.isEmpty = false;
        await tent.save({ session });
      }

      // Skip kitchen queue for rental-only orders (no items to prepare)
      let kitchenEntry: any = null;
      if (orderItems.length > 0) {
        kitchenEntry = new KitchenQueue({
          orderId: order._id,
          status: 'pending',
          priority: input.type === 'delivery' ? 1 : 0,
        });
        await kitchenEntry.save({ session });
      }

      // Auto-create payment
      const payment = new Payment({
        orderId: order._id,
        amount: totalTTC,
        method: input.paymentMethod || 'cash',
        status: 'completed',
        cashGiven: totalTTC,
        changeAmount: 0,
        userId,
      });
      await payment.save({ session });

      await session.commitTransaction();

      await Promise.all(
        changedInventoryItems.map((inventory) => InventoryService.checkThresholdAndEmit(inventory))
      );

      try {
        const io = getIO();
        const populatedOrder = await Order.findById(order._id).populate('tentId', 'tentNumber size');
        const tentData = (populatedOrder?.tentId as unknown as { tentNumber: number; size: string }) || {};
        const sizeLabel = tentData.size === 'small' ? 'صغيرة' : tentData.size === 'large' ? 'كبيرة' : 'متوسطة';
        const tentName = tentData.tentNumber ? `خيمة ${tentData.tentNumber} - ${sizeLabel}` : 'Unknown';

        emitNewOrder(io, {
          orderId: order._id.toString(),
          tentName,
          items: (input.items || []).map((item) => ({
            name: item.productId,
            quantity: item.quantity,
          })),
          priority: kitchenEntry?.priority || 0,
          timestamp: new Date(),
        });
      } catch (socketError) {
        logger.warn({ err: socketError }, 'Failed to emit Socket.IO event');
      }

      try {
        const populatedOrder = await Order.findById(order._id).populate('tentId', 'tentNumber size');
        const tentData2 = (populatedOrder?.tentId as unknown as { tentNumber: number; size: string }) || {};
        const sizeLabel2 = tentData2.size === 'small' ? 'صغيرة' : tentData2.size === 'large' ? 'كبيرة' : 'متوسطة';
        const tentName2 = tentData2.tentNumber ? `خيمة ${tentData2.tentNumber} - ${sizeLabel2}` : 'Unknown';

        const itemsWithName = await Promise.all(
          (input.items || []).map(async (item) => {
            const product = await Product.findById(item.productId).select('name');
            return { name: product?.name || item.productId, quantity: item.quantity };
          })
        );

        await NotificationService.notifyChefsNewOrder(
          order._id.toString(),
          orderNumber,
          tentName2,
          itemsWithName
        );
      } catch (notifError) {
        logger.warn({ err: notifError }, 'Failed to notify chefs');
      }

      try {
        await NotificationService.notifyPaymentReceived(
          order._id.toString(),
          orderNumber,
          totalTTC,
          input.paymentMethod || 'cash'
        );
      } catch (notifError) {
        logger.warn({ err: notifError }, 'Failed to notify about payment');
      }

      return {
        order,
        items: orderItems,
        kitchenQueueId: kitchenEntry?._id?.toString() || '',
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getOrders(filters: {
    status?: OrderStatus;
    tableId?: string;
    customerId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ orders: IOrder[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.tableId) {
      query.tableId = filters.tableId;
    }
    if (filters.customerId) {
      query.customerId = filters.customerId;
    }
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) {
        (query.createdAt as Record<string, unknown>).$gte = new Date(filters.from);
      }
      if (filters.to) {
        (query.createdAt as Record<string, unknown>).$lte = new Date(filters.to);
      }
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('tentId', 'tentNumber size')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return { orders, total };
  }

  static async getActiveOrders(userId: string): Promise<IOrder[]> {
    return Order.find({
      userId,
      status: { $in: ['new', 'preparing', 'ready'] },
    })
      .populate('tentId', 'tentNumber size')
      .sort({ createdAt: -1 });
  }

  static async getOrderById(id: string): Promise<{
    order: IOrder;
    items: IOrderItem[];
  }> {
    const order = await Order.findById(id)
      .populate('tentId', 'tentNumber size status')
      .populate('customerId', 'firstName lastName phone');

    if (!order) {
      throw new AppError(404, 'NOT_FOUND', 'Order not found');
    }

    const items = await OrderItem.find({ orderId: id }).populate('productId', 'name');

    return { order, items };
  }

  static async updateOrderStatus(id: string, status: OrderStatus): Promise<IOrder> {
    const order = await Order.findById(id);

    if (!order) {
      throw new AppError(404, 'NOT_FOUND', 'Order not found');
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      new: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['served'],
      served: ['completed'],
      cancelled: [],
      completed: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      throw new AppError(409, 'INVALID_STATE', `Cannot transition from ${order.status} to ${status}`);
    }

    order.status = status;
    await order.save();

    if (status === 'cancelled' || status === 'completed') {
      await Tent.findByIdAndUpdate(order.tentId, {
        status: 'free',
        currentOrderId: null,
        isEmpty: true,
        lastEmptiedAt: new Date(),
      });
    }

    try {
      const io = getIO();
      const populatedOrder = await Order.findById(order._id).populate('tentId', 'tentNumber size');
      const tentData = (populatedOrder?.tentId as unknown as { tentNumber: number; size: string }) || {};
      const sizeLabel = tentData.size === 'small' ? 'صغيرة' : tentData.size === 'large' ? 'كبيرة' : 'متوسطة';
      const tentName = tentData.tentNumber ? `خيمة ${tentData.tentNumber} - ${sizeLabel}` : 'Unknown';

      emitOrderStatusUpdate(io, {
        orderId: order._id.toString(),
        status,
        tentName,
        timestamp: new Date(),
      });

      if (status === 'served') {
        await NotificationService.notifyOrderServed(
          order._id.toString(),
          order.orderNumber || order._id.toString().slice(-6).toUpperCase(),
          tentName
        );
      }
    } catch (socketError) {
      logger.warn({ err: socketError }, 'Failed to emit Socket.IO event');
    }

    return order;
  }

  static async cancelOrder(orderId: string, reason: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
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

      const orderItems = await OrderItem.find({ orderId }).session(session);

      for (const item of orderItems) {
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

      await Tent.findByIdAndUpdate(
        order.tentId,
        { status: 'free', currentOrderId: null, isEmpty: true, lastEmptiedAt: new Date() },
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

      try {
        const io = getIO();
        emitOrderCancelled(io, {
          orderId: order._id.toString(),
          reason,
          timestamp: new Date(),
        });
      } catch (socketError) {
        logger.warn({ err: socketError }, 'Failed to emit Socket.IO event');
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
