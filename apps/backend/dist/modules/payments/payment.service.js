"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const Payment_1 = require("../../models/Payment");
const CashDrawer_1 = require("../../models/CashDrawer");
const Order_1 = require("../../models/Order");
const Customer_1 = require("../../models/Customer");
const LoyaltyTransaction_1 = require("../../models/LoyaltyTransaction");
const emitters_1 = require("../../socket/emitters");
const server_1 = require("../../server");
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = require("../../config/redis");
class PaymentService {
    static async processPayment(input) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const { orderId, amount, method, cashGiven, userId } = input;
            const order = await Order_1.Order.findById(orderId).session(session);
            if (!order)
                throw { status: 404, message: 'Order not found' };
            if (order.paid)
                throw { status: 400, message: 'Order already paid' };
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
            const payment = await Payment_1.Payment.create([{
                    orderId: order._id,
                    amount,
                    method,
                    status: 'completed',
                    transactionId: method !== 'cash' ? `txn_${Date.now()}` : undefined,
                    cashGiven,
                    changeAmount,
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                    branchId: order.branchId,
                }], { session });
            await Order_1.Order.findByIdAndUpdate(orderId, { status: 'paid', paid: true }, { session });
            const openDrawer = await CashDrawer_1.CashDrawer.findOne({
                branchId: order.branchId,
                status: 'open',
            }).session(session);
            if (openDrawer) {
                const updateFields = {};
                if (method === 'cash') {
                    updateFields.cashSales = openDrawer.cashSales + amount;
                    updateFields.currentBalance = openDrawer.currentBalance + amount;
                }
                else {
                    updateFields.cardSales = openDrawer.cardSales + amount;
                }
                await CashDrawer_1.CashDrawer.findByIdAndUpdate(openDrawer._id, updateFields, { session });
            }
            let loyaltyPointsEarned = 0;
            if (order.customerId) {
                const customer = await Customer_1.Customer.findById(order.customerId).session(session);
                if (customer) {
                    loyaltyPointsEarned = Math.floor(amount / 100);
                    customer.loyaltyPoints += loyaltyPointsEarned;
                    await customer.save({ session });
                    await LoyaltyTransaction_1.LoyaltyTransaction.create([{
                            customerId: customer._id,
                            type: 'earn',
                            points: loyaltyPointsEarned,
                            orderId: order._id,
                            description: `Earned ${loyaltyPointsEarned} points for order #${order._id}`,
                            userId: new mongoose_1.default.Types.ObjectId(userId),
                        }], { session });
                }
            }
            await session.commitTransaction();
            try {
                const cashier = await mongoose_1.default.model('User').findById(userId);
                (0, emitters_1.emitSaleNew)(server_1.io, {
                    orderId: order._id.toString(),
                    totalAmount: amount,
                    cashierName: cashier?.name || 'Unknown',
                    timestamp: new Date(),
                });
            }
            catch (err) {
                console.error('Failed to emit sale:new:', err);
            }
            return {
                paymentId: payment[0]._id.toString(),
                changeAmount,
                orderStatus: 'paid',
                loyaltyPointsEarned,
            };
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async getCashDrawer(branchId) {
        const cacheKey = `cashdrawer:${branchId}`;
        if ((0, redis_1.isRedisAvailable)()) {
            const cached = await redis_1.redis.get(cacheKey);
            if (cached)
                return JSON.parse(cached);
        }
        const drawer = await CashDrawer_1.CashDrawer.findOne({ branchId, status: 'open' });
        if (drawer && (0, redis_1.isRedisAvailable)()) {
            await redis_1.redis.setex(cacheKey, 300, JSON.stringify(drawer));
        }
        return drawer;
    }
    static async openCashDrawer(branchId, openingBalance, userId) {
        const existing = await CashDrawer_1.CashDrawer.findOne({ branchId, status: 'open' });
        if (existing)
            throw { status: 400, message: 'Cash drawer already open' };
        const drawer = await CashDrawer_1.CashDrawer.create({
            branchId: new mongoose_1.default.Types.ObjectId(branchId),
            status: 'open',
            openingBalance,
            currentBalance: openingBalance,
            cashSales: 0,
            cardSales: 0,
            cashOut: 0,
            openedBy: new mongoose_1.default.Types.ObjectId(userId),
            openedAt: new Date(),
        });
        if ((0, redis_1.isRedisAvailable)()) {
            await redis_1.redis.del(`cashdrawer:${branchId}`);
        }
        return drawer;
    }
    static async closeCashDrawer(drawerId, declaredBalance, userId) {
        const drawer = await CashDrawer_1.CashDrawer.findById(drawerId);
        if (!drawer)
            throw { status: 404, message: 'Cash drawer not found' };
        if (drawer.status === 'closed')
            throw { status: 400, message: 'Cash drawer already closed' };
        const expectedBalance = drawer.openingBalance + drawer.cashSales - drawer.cashOut;
        const difference = declaredBalance - expectedBalance;
        await CashDrawer_1.CashDrawer.findByIdAndUpdate(drawerId, {
            status: 'closed',
            closingBalance: declaredBalance,
            difference,
            closedBy: new mongoose_1.default.Types.ObjectId(userId),
            closedAt: new Date(),
        });
        if ((0, redis_1.isRedisAvailable)()) {
            await redis_1.redis.del(`cashdrawer:${drawer.branchId}`);
        }
        return {
            expectedBalance,
            declaredBalance,
            difference,
            cashSales: drawer.cashSales,
        };
    }
    static async getPaymentsByOrder(orderId) {
        return Payment_1.Payment.find({ orderId });
    }
    static async refundPayment(paymentId) {
        const payment = await Payment_1.Payment.findById(paymentId);
        if (!payment)
            throw { status: 404, message: 'Payment not found' };
        if (payment.status === 'refunded')
            throw { status: 400, message: 'Payment already refunded' };
        payment.status = 'refunded';
        await payment.save();
        if (payment.method === 'cash') {
            const drawer = await CashDrawer_1.CashDrawer.findOne({
                branchId: payment.branchId,
                status: 'open',
            });
            if (drawer) {
                drawer.cashSales -= payment.amount;
                drawer.currentBalance -= payment.amount;
                await drawer.save();
            }
        }
        await Order_1.Order.findByIdAndUpdate(payment.orderId, { paid: false, status: 'pending' });
        return payment;
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=payment.service.js.map