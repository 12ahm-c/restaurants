"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Order_1 = require("../../models/Order");
const OrderItem_1 = require("../../models/OrderItem");
const Table_1 = require("../../models/Table");
const Product_1 = require("../../models/Product");
const Inventory_1 = require("../../models/Inventory");
const KitchenQueue_1 = require("../../models/KitchenQueue");
const response_1 = require("../../utils/response");
const socket_server_1 = require("../../socket/socket.server");
const emitters_1 = require("../../socket/emitters");
const inventory_service_1 = require("../inventory/inventory.service");
class OrderService {
    static async createOrder(userId, input) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // tableId is required only for dine-in
            if (input.type === 'dine-in' && !input.tableId) {
                throw new response_1.AppError(400, 'VALIDATION_ERROR', 'Table is required for dine-in orders');
            }
            let table = null;
            if (input.tableId) {
                table = await Table_1.Table.findById(input.tableId).session(session);
                if (!table) {
                    throw new response_1.AppError(404, 'NOT_FOUND', 'Table not found');
                }
                if (table.status === 'occupied') {
                    throw new response_1.AppError(409, 'TABLE_OCCUPIED', 'Table is already occupied');
                }
            }
            const orderItems = [];
            let totalHT = 0;
            for (const item of input.items) {
                const product = await Product_1.Product.findById(item.productId).session(session);
                if (!product) {
                    throw new response_1.AppError(404, 'NOT_FOUND', `Product ${item.productId} not found`);
                }
                if (product.status !== 'available') {
                    throw new response_1.AppError(422, 'INVALID_STATE', `Product ${product.name} is not available`);
                }
                const optionsTotal = item.options?.reduce((sum, opt) => sum + opt.price, 0) || 0;
                const itemTotal = (product.price + optionsTotal) * item.quantity;
                totalHT += itemTotal;
                orderItems.push({
                    orderId: new mongoose_1.default.Types.ObjectId(),
                    productId: product._id,
                    variant: item.variant,
                    quantity: item.quantity,
                    unitPrice: product.price,
                    options: item.options || [],
                    notes: item.notes,
                    total: itemTotal,
                });
            }
            const taxRate = 0;
            const totalTTC = totalHT * (1 + taxRate);
            const changedInventoryItems = [];
            // Generate order number: ORD-YYYYMMDD-XXXX
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const countToday = await Order_1.Order.countDocuments({
                createdAt: {
                    $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                    $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
                },
            });
            const orderNumber = `ORD-${dateStr}-${String(countToday + 1).padStart(4, '0')}`;
            const order = new Order_1.Order({
                orderNumber,
                tableId: input.tableId || undefined,
                customerId: input.customerId,
                userId,
                type: input.type,
                status: 'new',
                totalHT,
                totalTTC,
                notes: input.notes,
            });
            await order.save({ session });
            for (const item of orderItems) {
                item.orderId = order._id;
                await OrderItem_1.OrderItem.create([item], { session });
            }
            for (const item of input.items) {
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
            // Only update table status for dine-in orders
            if (table) {
                table.status = 'occupied';
                table.currentOrderId = order._id;
                await table.save({ session });
            }
            const kitchenEntry = new KitchenQueue_1.KitchenQueue({
                orderId: order._id,
                status: 'pending',
                priority: input.type === 'delivery' ? 1 : 0,
            });
            await kitchenEntry.save({ session });
            await session.commitTransaction();
            await Promise.all(changedInventoryItems.map((inventory) => inventory_service_1.InventoryService.checkThresholdAndEmit(inventory)));
            try {
                const io = (0, socket_server_1.getIO)();
                const populatedOrder = await Order_1.Order.findById(order._id).populate('tableId', 'name');
                const tableName = populatedOrder?.tableId?.name || 'Unknown';
                (0, emitters_1.emitNewOrder)(io, {
                    orderId: order._id.toString(),
                    tableName,
                    items: input.items.map((item) => ({
                        name: item.productId,
                        quantity: item.quantity,
                    })),
                    priority: kitchenEntry.priority,
                    timestamp: new Date(),
                });
            }
            catch (socketError) {
                logger_1.logger.warn({ err: socketError }, 'Failed to emit Socket.IO event');
            }
            return {
                order,
                items: orderItems,
                kitchenQueueId: kitchenEntry._id.toString(),
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
            .populate('tableId', 'name')
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
            .populate('tableId', 'name')
            .sort({ createdAt: -1 });
    }
    static async getOrderById(id) {
        const order = await Order_1.Order.findById(id)
            .populate('tableId', 'name status')
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
            served: ['paid'],
            paid: [],
            cancelled: [],
        };
        if (!validTransitions[order.status]?.includes(status)) {
            throw new response_1.AppError(409, 'INVALID_STATE', `Cannot transition from ${order.status} to ${status}`);
        }
        order.status = status;
        await order.save();
        if (status === 'served' || status === 'cancelled') {
            await Table_1.Table.findByIdAndUpdate(order.tableId, {
                status: 'free',
                currentOrderId: null,
            });
        }
        try {
            const io = (0, socket_server_1.getIO)();
            const populatedOrder = await Order_1.Order.findById(order._id).populate('tableId', 'name');
            const tableName = populatedOrder?.tableId?.name || 'Unknown';
            (0, emitters_1.emitOrderStatusUpdate)(io, {
                orderId: order._id.toString(),
                status,
                tableName,
                timestamp: new Date(),
            });
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
            await Table_1.Table.findByIdAndUpdate(order.tableId, { status: 'free', currentOrderId: null }, { session });
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
const logger_1 = require("../../utils/logger");
//# sourceMappingURL=order.service.js.map