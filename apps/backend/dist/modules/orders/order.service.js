"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Order_1 = require("../../models/Order");
const OrderItem_1 = require("../../models/OrderItem");
const Tent_1 = require("../../models/Tent");
const Product_1 = require("../../models/Product");
const Inventory_1 = require("../../models/Inventory");
const KitchenQueue_1 = require("../../models/KitchenQueue");
const Payment_1 = require("../../models/Payment");
const response_1 = require("../../utils/response");
const socket_server_1 = require("../../socket/socket.server");
const emitters_1 = require("../../socket/emitters");
const inventory_service_1 = require("../inventory/inventory.service");
const notification_service_1 = require("../notifications/notification.service");
const logger_1 = require("../../utils/logger");
class OrderService {
    static async createOrder(userId, input) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // Validate tent requirements based on order type
            if (input.type === 'dine-in' && !input.tentId) {
                throw new response_1.AppError(400, 'VALIDATION_ERROR', 'Tent is required for dine-in orders');
            }
            if (input.type === 'rental' && !input.tentId) {
                throw new response_1.AppError(400, 'VALIDATION_ERROR', 'Tent is required for rental orders');
            }
            let tent = null;
            if (input.tentId) {
                tent = await Tent_1.Tent.findById(input.tentId).session(session);
                if (!tent) {
                    throw new response_1.AppError(404, 'NOT_FOUND', 'Tent not found');
                }
                if (tent.status === 'occupied') {
                    throw new response_1.AppError(409, 'TENT_OCCUPIED', 'Tent is already occupied');
                }
            }
            const orderItems = [];
            let totalHT = 0;
            // For rental-only orders, totalHT is just the rental price
            if (input.type === 'rental') {
                totalHT = input.rentalPrice || 0;
            }
            for (const item of (input.items || [])) {
                const product = await Product_1.Product.findById(item.productId).session(session);
                if (!product) {
                    throw new response_1.AppError(404, 'NOT_FOUND', `Product ${item.productId} not found`);
                }
                if (product.status !== 'available') {
                    throw new response_1.AppError(422, 'INVALID_STATE', `Product ${product.name} is not available`);
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
                    orderId: new mongoose_1.default.Types.ObjectId(),
                    productId: product._id,
                    variant: item.variant,
                    quantity: item.quantity,
                    unitPrice,
                    options: item.options || [],
                    quantityTypeName: item.quantityTypeName,
                    quantityTypeLabel: item.quantityTypeLabel,
                    notes: item.notes,
                    total: itemTotal,
                });
            }
            const taxRate = 0;
            const totalTTC = totalHT * (1 + taxRate);
            const changedInventoryItems = [];
            // Generate simple sequential order number
            const lastOrder = await Order_1.Order.findOne().sort({ createdAt: -1 }).select('orderNumber');
            let nextNumber = 1;
            if (lastOrder?.orderNumber) {
                const parsed = parseInt(lastOrder.orderNumber, 10);
                if (!isNaN(parsed)) {
                    nextNumber = parsed + 1;
                }
            }
            const orderNumber = String(nextNumber);
            const order = new Order_1.Order({
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
                await OrderItem_1.OrderItem.create([item], { session });
            }
            for (const item of (input.items || [])) {
                const product = await Product_1.Product.findById(item.productId).session(session);
                if (product?.recipe) {
                    for (const recipeItem of product.recipe) {
                        const inventory = await Inventory_1.Inventory.findById(recipeItem.inventoryId).session(session);
                        if (inventory) {
                            const deduction = recipeItem.quantity * item.quantity;
                            if (inventory.quantity < deduction) {
                                throw new response_1.AppError(422, 'INSUFFICIENT_STOCK', `Insufficient stock for ${inventory.name}`);
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
            let kitchenEntry = null;
            if (orderItems.length > 0) {
                kitchenEntry = new KitchenQueue_1.KitchenQueue({
                    orderId: order._id,
                    status: 'pending',
                    priority: input.type === 'delivery' ? 1 : 0,
                });
                await kitchenEntry.save({ session });
            }
            // Auto-create payment
            const payment = new Payment_1.Payment({
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
            await Promise.all(changedInventoryItems.map((inventory) => inventory_service_1.InventoryService.checkThresholdAndEmit(inventory)));
            try {
                const io = (0, socket_server_1.getIO)();
                const populatedOrder = await Order_1.Order.findById(order._id).populate('tentId', 'tentNumber size');
                const tentData = populatedOrder?.tentId || {};
                const sizeLabel = tentData.size === 'small' ? 'صغيرة' : tentData.size === 'large' ? 'كبيرة' : 'متوسطة';
                const tentName = tentData.tentNumber ? `خيمة ${tentData.tentNumber} - ${sizeLabel}` : 'Unknown';
                (0, emitters_1.emitNewOrder)(io, {
                    orderId: order._id.toString(),
                    tentName,
                    items: (input.items || []).map((item) => ({
                        name: item.productId,
                        quantity: item.quantity,
                    })),
                    priority: kitchenEntry?.priority || 0,
                    timestamp: new Date(),
                });
            }
            catch (socketError) {
                logger_1.logger.warn({ err: socketError }, 'Failed to emit Socket.IO event');
            }
            try {
                const populatedOrder = await Order_1.Order.findById(order._id).populate('tentId', 'tentNumber size');
                const tentData2 = populatedOrder?.tentId || {};
                const sizeLabel2 = tentData2.size === 'small' ? 'صغيرة' : tentData2.size === 'large' ? 'كبيرة' : 'متوسطة';
                const tentName2 = tentData2.tentNumber ? `خيمة ${tentData2.tentNumber} - ${sizeLabel2}` : 'Unknown';
                const itemsWithName = await Promise.all((input.items || []).map(async (item) => {
                    const product = await Product_1.Product.findById(item.productId).select('name');
                    return { name: product?.name || item.productId, quantity: item.quantity };
                }));
                await notification_service_1.NotificationService.notifyChefsNewOrder(order._id.toString(), orderNumber, tentName2, itemsWithName);
            }
            catch (notifError) {
                logger_1.logger.warn({ err: notifError }, 'Failed to notify chefs');
            }
            try {
                await notification_service_1.NotificationService.notifyPaymentReceived(order._id.toString(), orderNumber, totalTTC, input.paymentMethod || 'cash');
            }
            catch (notifError) {
                logger_1.logger.warn({ err: notifError }, 'Failed to notify about payment');
            }
            return {
                order,
                items: orderItems,
                kitchenQueueId: kitchenEntry?._id?.toString() || '',
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
    static async getOrders(filters) {
        const query = {};
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
                query.createdAt.$gte = new Date(filters.from);
            }
            if (filters.to) {
                query.createdAt.$lte = new Date(filters.to);
            }
        }
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 20, 100);
        const skip = (page - 1) * limit;
        const total = await Order_1.Order.countDocuments(query);
        const orders = await Order_1.Order.find(query)
            .populate('tentId', 'tentNumber size')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return { orders, total };
    }
    static async getActiveOrders(userId) {
        return Order_1.Order.find({
            userId,
            status: { $in: ['new', 'preparing', 'ready'] },
        })
            .populate('tentId', 'tentNumber size')
            .sort({ createdAt: -1 });
    }
    static async getOrderById(id) {
        const order = await Order_1.Order.findById(id)
            .populate('tentId', 'tentNumber size status')
            .populate('customerId', 'firstName lastName phone');
        if (!order) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Order not found');
        }
        const items = await OrderItem_1.OrderItem.find({ orderId: id }).populate('productId', 'name');
        return { order, items };
    }
    static async updateOrderStatus(id, status) {
        const order = await Order_1.Order.findById(id);
        if (!order) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Order not found');
        }
        const validTransitions = {
            new: ['preparing', 'cancelled'],
            preparing: ['ready', 'cancelled'],
            ready: ['served'],
            served: ['completed'],
            cancelled: [],
            completed: [],
        };
        if (!validTransitions[order.status]?.includes(status)) {
            throw new response_1.AppError(409, 'INVALID_STATE', `Cannot transition from ${order.status} to ${status}`);
        }
        order.status = status;
        await order.save();
        if (status === 'cancelled' || status === 'completed') {
            await Tent_1.Tent.findByIdAndUpdate(order.tentId, {
                status: 'free',
                currentOrderId: null,
                isEmpty: true,
                lastEmptiedAt: new Date(),
            });
        }
        try {
            const io = (0, socket_server_1.getIO)();
            const populatedOrder = await Order_1.Order.findById(order._id).populate('tentId', 'tentNumber size');
            const tentData = populatedOrder?.tentId || {};
            const sizeLabel = tentData.size === 'small' ? 'صغيرة' : tentData.size === 'large' ? 'كبيرة' : 'متوسطة';
            const tentName = tentData.tentNumber ? `خيمة ${tentData.tentNumber} - ${sizeLabel}` : 'Unknown';
            (0, emitters_1.emitOrderStatusUpdate)(io, {
                orderId: order._id.toString(),
                status,
                tentName,
                timestamp: new Date(),
            });
            if (status === 'served') {
                await notification_service_1.NotificationService.notifyOrderServed(order._id.toString(), order.orderNumber || order._id.toString().slice(-6).toUpperCase(), tentName);
            }
            if (status === 'ready') {
                await notification_service_1.NotificationService.notifyServersOrderReady(order._id.toString(), order.orderNumber || order._id.toString().slice(-6).toUpperCase(), tentName);
            }
        }
        catch (socketError) {
            logger_1.logger.warn({ err: socketError }, 'Failed to emit Socket.IO event');
        }
        return order;
    }
    static async cancelOrder(orderId, reason) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const order = await Order_1.Order.findById(orderId).session(session);
            if (!order) {
                throw new response_1.AppError(404, 'NOT_FOUND', 'Order not found');
            }
            const cancellableStatuses = ['new', 'preparing'];
            if (!cancellableStatuses.includes(order.status)) {
                throw new response_1.AppError(409, 'INVALID_STATE', `Cannot cancel order in ${order.status} status`);
            }
            const orderItems = await OrderItem_1.OrderItem.find({ orderId }).session(session);
            for (const item of orderItems) {
                const product = await Product_1.Product.findById(item.productId).session(session);
                if (product?.recipe) {
                    for (const recipeItem of product.recipe) {
                        const inventory = await Inventory_1.Inventory.findById(recipeItem.inventoryId).session(session);
                        if (inventory) {
                            const restoration = recipeItem.quantity * item.quantity;
                            inventory.quantity += restoration;
                            await inventory.save({ session });
                        }
                    }
                }
            }
            await Tent_1.Tent.findByIdAndUpdate(order.tentId, { status: 'free', currentOrderId: null, isEmpty: true, lastEmptiedAt: new Date() }, { session });
            await KitchenQueue_1.KitchenQueue.findOneAndUpdate({ orderId }, { status: 'ready', endTime: new Date() }, { session });
            order.status = 'cancelled';
            await order.save({ session });
            await session.commitTransaction();
            try {
                const io = (0, socket_server_1.getIO)();
                (0, emitters_1.emitOrderCancelled)(io, {
                    orderId: order._id.toString(),
                    reason,
                    timestamp: new Date(),
                });
            }
            catch (socketError) {
                logger_1.logger.warn({ err: socketError }, 'Failed to emit Socket.IO event');
            }
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=order.service.js.map