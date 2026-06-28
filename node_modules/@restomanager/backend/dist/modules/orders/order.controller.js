"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const zod_1 = require("zod");
const order_service_1 = require("./order.service");
const response_1 = require("../../utils/response");
const createOrderSchema = zod_1.z.object({
    tableId: zod_1.z.string().optional(),
    customerId: zod_1.z.string().optional(),
    type: zod_1.z.enum(['dine-in', 'takeaway', 'delivery']),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        quantity: zod_1.z.number().min(1),
        variant: zod_1.z.string().optional(),
        options: zod_1.z
            .array(zod_1.z.object({
            name: zod_1.z.string(),
            price: zod_1.z.number(),
        }))
            .optional(),
        notes: zod_1.z.string().optional(),
    }))
        .min(1, 'At least one item is required'),
    notes: zod_1.z.string().optional(),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['new', 'preparing', 'ready', 'served', 'paid', 'cancelled']),
});
function handleError(res, error) {
    if (error instanceof response_1.AppError) {
        (0, response_1.sendError)(res, error.statusCode, error.code, error.message);
        return;
    }
    (0, response_1.sendError)(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}
class OrderController {
    static async createOrder(req, res) {
        const idempotencyKey = req.headers['idempotency-key'];
        const result = createOrderSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const { order, items, kitchenQueueId } = await order_service_1.OrderService.createOrder(req.user.sub, result.data);
            (0, response_1.sendSuccess)(res, {
                orderId: order._id,
                orderNumber: order.orderNumber,
                tableStatus: order.tableId ? 'occupied' : 'n/a',
                kitchenQueueId,
                ticketUrl: null,
            }, 201);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async getOrders(req, res) {
        const status = req.query.status;
        const tableId = req.query.tableId;
        const customerId = req.query.customerId;
        const from = req.query.from;
        const to = req.query.to;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        try {
            const { orders, total } = await order_service_1.OrderService.getOrders({
                status: status,
                tableId,
                customerId,
                from,
                to,
                page,
                limit,
            });
            (0, response_1.sendSuccess)(res, orders, 200, {
                page,
                limit,
                total,
                hasMore: page * limit < total,
            });
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async getActiveOrders(req, res) {
        try {
            const orders = await order_service_1.OrderService.getActiveOrders(req.user.sub);
            (0, response_1.sendSuccess)(res, orders);
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async getOrderById(req, res) {
        try {
            const { order, items } = await order_service_1.OrderService.getOrderById(req.params.id);
            (0, response_1.sendSuccess)(res, { order, items });
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async updateOrderStatus(req, res) {
        const result = updateStatusSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        try {
            const order = await order_service_1.OrderService.updateOrderStatus(req.params.id, result.data.status);
            (0, response_1.sendSuccess)(res, order);
        }
        catch (error) {
            handleError(res, error);
        }
    }
}
exports.OrderController = OrderController;
//# sourceMappingURL=order.controller.js.map