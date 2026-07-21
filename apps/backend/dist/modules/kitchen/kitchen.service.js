"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KitchenService = void 0;
const KitchenQueue_1 = require("../../models/KitchenQueue");
const Order_1 = require("../../models/Order");
const OrderItem_1 = require("../../models/OrderItem");
const response_1 = require("../../utils/response");
const socket_server_1 = require("../../socket/socket.server");
const emitters_1 = require("../../socket/emitters");
const notification_service_1 = require("../notifications/notification.service");
const logger_1 = require("../../utils/logger");
class KitchenService {
    static async getQueue(filters) {
        const query = {};
        if (filters?.status) {
            query.status = filters.status;
        }
        if (filters?.priority !== undefined) {
            query.priority = filters.priority;
        }
        const queue = await KitchenQueue_1.KitchenQueue.find(query)
            .populate({
            path: 'orderId',
            select: 'orderNumber type status totalTTC notes createdAt',
            populate: {
                path: 'tentId',
                select: 'tentNumber size',
            },
        })
            .sort({ priority: -1, createdAt: 1 });
        const queueWithItems = await Promise.all(queue.map(async (entry) => {
            const orderData = entry.orderId;
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
            const orderItems = await OrderItem_1.OrderItem.find({ orderId: orderData._id })
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
                    productId: item.productId?._id || '',
                    productName: item.productId?.name || '',
                    quantity: item.quantity,
                    notes: item.notes,
                })),
            };
        }));
        return queueWithItems;
    }
    static async getPriorityQueue() {
        return this.getQueue({ priority: 1 });
    }
    static async startPreparation(id) {
        const entry = await KitchenQueue_1.KitchenQueue.findById(id);
        if (!entry) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Kitchen queue entry not found');
        }
        if (entry.status !== 'pending') {
            throw new response_1.AppError(409, 'INVALID_STATE', 'Order is not in pending status');
        }
        entry.status = 'preparing';
        entry.startTime = new Date();
        await entry.save();
        const order = await Order_1.Order.findByIdAndUpdate(entry.orderId, { status: 'preparing' }, { new: true }).populate('tentId', 'tentNumber size');
        if (order) {
            try {
                const io = (0, socket_server_1.getIO)();
                const tentData = order.tentId || {};
                const sizeLabel = tentData.size === 'small' ? 'صغيرة' : tentData.size === 'large' ? 'كبيرة' : 'متوسطة';
                const tentName = tentData.tentNumber ? `خيمة ${tentData.tentNumber} - ${sizeLabel}` : 'Unknown';
                (0, emitters_1.emitOrderStatusUpdate)(io, {
                    orderId: order._id.toString(),
                    status: 'preparing',
                    tentName,
                    timestamp: new Date(),
                });
            }
            catch (socketError) {
                // ignore
            }
        }
        return entry;
    }
    static async markReady(id) {
        const entry = await KitchenQueue_1.KitchenQueue.findById(id);
        if (!entry) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Kitchen queue entry not found');
        }
        if (entry.status !== 'preparing') {
            throw new response_1.AppError(409, 'INVALID_STATE', 'Order is not in preparing status');
        }
        entry.status = 'ready';
        entry.endTime = new Date();
        await entry.save();
        const order = await Order_1.Order.findByIdAndUpdate(entry.orderId, { status: 'ready' }, { new: true }).populate('tentId', 'tentNumber size');
        if (order) {
            try {
                const io = (0, socket_server_1.getIO)();
                const tentData = order.tentId || {};
                const sizeLabel = tentData.size === 'small' ? 'صغيرة' : tentData.size === 'large' ? 'كبيرة' : 'متوسطة';
                const tentName = tentData.tentNumber ? `خيمة ${tentData.tentNumber} - ${sizeLabel}` : 'Unknown';
                (0, emitters_1.emitOrderStatusUpdate)(io, {
                    orderId: order._id.toString(),
                    status: 'ready',
                    tentName,
                    timestamp: new Date(),
                });
                await notification_service_1.NotificationService.notifyServersOrderReady(order._id.toString(), order.orderNumber || order._id.toString().slice(-6).toUpperCase(), tentName);
            }
            catch (socketError) {
                logger_1.logger.warn({ err: socketError }, 'Failed to emit ready status or notify servers');
            }
        }
        return entry;
    }
}
exports.KitchenService = KitchenService;
//# sourceMappingURL=kitchen.service.js.map