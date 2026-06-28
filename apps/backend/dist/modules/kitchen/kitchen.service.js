"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.KitchenService = void 0;
const KitchenQueue_1 = require("../../models/KitchenQueue");
const Table_1 = require("../../models/Table");
const Inventory_1 = require("../../models/Inventory");
const response_1 = require("../../utils/response");
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
            select: 'type status totalTTC notes createdAt',
            populate: {
                path: 'tableId',
                select: 'name zone',
            },
        })
            .sort({ priority: -1, createdAt: 1 });
        const queueWithItems = await Promise.all(queue.map(async (entry) => {
            const orderData = entry.orderId;
            const OrderItem = (await Promise.resolve().then(() => __importStar(require('../../models/OrderItem')))).OrderItem;
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
                    productId: item.productId._id,
                    productName: item.productId.name,
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
        return entry;
    }
    static async cancelOrder(orderId, reason) {
        const session = await (await Promise.resolve().then(() => __importStar(require('mongoose')))).startSession();
        session.startTransaction();
        try {
            const Order = (await Promise.resolve().then(() => __importStar(require('../../models/Order')))).Order;
            const order = await Order.findById(orderId).session(session);
            if (!order) {
                throw new response_1.AppError(404, 'NOT_FOUND', 'Order not found');
            }
            const cancellableStatuses = ['new', 'preparing'];
            if (!cancellableStatuses.includes(order.status)) {
                throw new response_1.AppError(409, 'INVALID_STATE', `Cannot cancel order in ${order.status} status`);
            }
            const OrderItem = (await Promise.resolve().then(() => __importStar(require('../../models/OrderItem')))).OrderItem;
            const orderItems = await OrderItem.find({ orderId }).session(session);
            for (const item of orderItems) {
                const Product = (await Promise.resolve().then(() => __importStar(require('../../models/Product')))).Product;
                const product = await Product.findById(item.productId).session(session);
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
exports.KitchenService = KitchenService;
//# sourceMappingURL=kitchen.service.js.map