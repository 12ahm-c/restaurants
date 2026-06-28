import { Payment, IPayment, PaymentMethod } from '../../models/Payment';
import { CashDrawer, ICashDrawer } from '../../models/CashDrawer';
import { Order } from '../../models/Order';
import { Customer } from '../../models/Customer';
import { LoyaltyTransaction } from '../../models/LoyaltyTransaction';
import { emitSaleNew, emitDashboardUpdate } from '../../socket/emitters';
import { io } from '../../server';
import mongoose from 'mongoose';
import { redis, isRedisAvailable } from '../../config/redis';

interface ProcessPaymentInput {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  cashGiven?: number;
  userId: string;
}

export class PaymentService {
  static async processPayment(input: ProcessPaymentInput): Promise<{
    paymentId: string;
    changeAmount: number;
    orderStatus: string;
    loyaltyPointsEarned: number;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { orderId, amount, method, cashGiven, userId } = input;

      const order = await Order.findById(orderId).session(session);
      if (!order) throw { status: 404, message: 'Order not found' };

      // Check if payment already exists for this order
      const existingPayment = await Payment.findOne({ orderId: order._id, status: 'completed' }).session(session);
      if (existingPayment) throw { status: 400, message: 'Order already paid' };

      if (Math.abs(amount - order.totalTTC) > 0.01) {
        throw { status: 400, message: 'Amount does not match order total' };
      }

      let changeAmount = 0;
      if (method === 'cash') {
        if (!cashGiven || cashGiven < amount) {
          throw { status: 400, message: 'Cash given must be greater than or equal to amount' };
        }
        changeAmount = cashGiven - amount;
      }

      const payment = await Payment.create(
        [{
          orderId: order._id,
          amount,
          method,
          status: 'completed',
          transactionId: method !== 'cash' ? `txn_${Date.now()}` : undefined,
          cashGiven,
          changeAmount,
          userId: new mongoose.Types.ObjectId(userId),
          branchId: order.branchId,
        }],
        { session }
      );

      await Order.findByIdAndUpdate(
        orderId,
        { status: 'completed' },
        { session }
      );

      const openDrawer = await CashDrawer.findOne({
        branchId: order.branchId,
        status: 'open',
      }).session(session);

      if (openDrawer) {
        const updateFields: any = {};
        if (method === 'cash') {
          updateFields.cashSales = openDrawer.cashSales + amount;
          updateFields.currentBalance = openDrawer.currentBalance + amount;
        } else {
          updateFields.cardSales = openDrawer.cardSales + amount;
        }
        await CashDrawer.findByIdAndUpdate(openDrawer._id, updateFields, { session });
      }

      let loyaltyPointsEarned = 0;
      if (order.customerId) {
        const customer = await Customer.findById(order.customerId).session(session);
        if (customer) {
          loyaltyPointsEarned = Math.floor(amount / 100);
          customer.loyaltyPoints += loyaltyPointsEarned;
          await customer.save({ session });

          await LoyaltyTransaction.create(
            [{
              customerId: customer._id,
              type: 'earn',
              points: loyaltyPointsEarned,
              orderId: order._id,
              description: `Earned ${loyaltyPointsEarned} points for order #${order._id}`,
              userId: new mongoose.Types.ObjectId(userId),
            }],
            { session }
          );
        }
      }

      await session.commitTransaction();

      try {
        const cashier = await mongoose.model('User').findById(userId);
        emitSaleNew(io, {
          orderId: order._id.toString(),
          totalAmount: amount,
          cashierName: cashier?.name || 'Unknown',
          timestamp: new Date(),
        });
      } catch (err) {
        console.error('Failed to emit sale:new:', err);
      }

      return {
        paymentId: payment[0]._id.toString(),
        changeAmount,
        orderStatus: 'paid',
        loyaltyPointsEarned,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getCashDrawer(branchId: string): Promise<ICashDrawer | null> {
    const cacheKey = `cashdrawer:${branchId}`;
    
    if (isRedisAvailable()) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const drawer = await CashDrawer.findOne({ branchId, status: 'open' });
    if (drawer && isRedisAvailable()) {
      await redis.setex(cacheKey, 300, JSON.stringify(drawer));
    }
    return drawer;
  }

  static async openCashDrawer(branchId: string, openingBalance: number, userId: string): Promise<ICashDrawer> {
    const existing = await CashDrawer.findOne({ branchId, status: 'open' });
    if (existing) throw { status: 400, message: 'Cash drawer already open' };

    const drawer = await CashDrawer.create({
      branchId: new mongoose.Types.ObjectId(branchId),
      status: 'open',
      openingBalance,
      currentBalance: openingBalance,
      cashSales: 0,
      cardSales: 0,
      cashOut: 0,
      openedBy: new mongoose.Types.ObjectId(userId),
      openedAt: new Date(),
    });

    if (isRedisAvailable()) {
      await redis.del(`cashdrawer:${branchId}`);
    }
    return drawer;
  }

  static async closeCashDrawer(
    drawerId: string,
    declaredBalance: number,
    userId: string
  ): Promise<{
    expectedBalance: number;
    declaredBalance: number;
    difference: number;
    cashSales: number;
  }> {
    const drawer = await CashDrawer.findById(drawerId);
    if (!drawer) throw { status: 404, message: 'Cash drawer not found' };
    if (drawer.status === 'closed') throw { status: 400, message: 'Cash drawer already closed' };

    const expectedBalance = drawer.openingBalance + drawer.cashSales - drawer.cashOut;
    const difference = declaredBalance - expectedBalance;

    await CashDrawer.findByIdAndUpdate(drawerId, {
      status: 'closed',
      closingBalance: declaredBalance,
      difference,
      closedBy: new mongoose.Types.ObjectId(userId),
      closedAt: new Date(),
    });

    if (isRedisAvailable()) {
      await redis.del(`cashdrawer:${drawer.branchId}`);
    }

    return {
      expectedBalance,
      declaredBalance,
      difference,
      cashSales: drawer.cashSales,
    };
  }

  static async getPaymentsByOrder(orderId: string): Promise<IPayment[]> {
    return Payment.find({ orderId });
  }

  static async getAllPayments(filters: {
    method?: PaymentMethod;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ payments: IPayment[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters.method) {
      query.method = filters.method;
    }
    if (filters.status) {
      query.status = filters.status;
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
    const limit = Math.min(filters.limit || 50, 100);
    const skip = (page - 1) * limit;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('orderId', 'orderNumber totalTTC type status tableId')
      .populate({
        path: 'orderId',
        populate: { path: 'tableId', select: 'name' },
      })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return { payments, total };
  }

  static async refundPayment(paymentId: string): Promise<IPayment> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw { status: 404, message: 'Payment not found' };
    if (payment.status === 'refunded') throw { status: 400, message: 'Payment already refunded' };

    payment.status = 'refunded';
    await payment.save();

    if (payment.method === 'cash') {
      const drawer = await CashDrawer.findOne({
        branchId: payment.branchId,
        status: 'open',
      });
      if (drawer) {
        drawer.cashSales -= payment.amount;
        drawer.currentBalance -= payment.amount;
        await drawer.save();
      }
    }

    await Order.findByIdAndUpdate(payment.orderId, { paid: false, status: 'pending' });

    return payment;
  }
}
