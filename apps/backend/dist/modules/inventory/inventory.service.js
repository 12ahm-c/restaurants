"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const Inventory_1 = require("../../models/Inventory");
const StockMovement_1 = require("../../models/StockMovement");
const Supplier_1 = require("../../models/Supplier");
const SupplierDebtMovement_1 = require("../../models/SupplierDebtMovement");
const response_1 = require("../../utils/response");
const redis_1 = require("../../config/redis");
const socket_server_1 = require("../../socket/socket.server");
const emitters_1 = require("../../socket/emitters");
const notification_service_1 = require("../notifications/notification.service");
const mongoose_1 = __importDefault(require("mongoose"));
const STOCK_VALUE_CACHE_TTL = 300; // 5 minutes
const CRITICAL_STOCK_QUANTITY = 3;
class InventoryService {
    static async getInventoryItems(query) {
        const { branchId, category, belowThreshold, search, page = '1', limit = '20', sortBy = 'name', sortOrder = 'asc', } = query;
        const filter = { isActive: true };
        if (branchId)
            filter.branchId = branchId;
        if (category)
            filter.category = category;
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        if (belowThreshold === 'true') {
            filter.$expr = { $lte: ['$quantity', '$threshold'] };
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
        const [items, total] = await Promise.all([
            Inventory_1.Inventory.find(filter).sort(sort).skip(skip).limit(limitNum),
            Inventory_1.Inventory.countDocuments(filter),
        ]);
        return { items, total, page: pageNum, limit: limitNum };
    }
    static async getInventoryById(id) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new response_1.AppError(400, 'INVALID_ID', 'Invalid inventory ID');
        }
        const item = await Inventory_1.Inventory.findOne({ _id: id, isActive: true });
        if (!item) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Inventory item not found');
        }
        return item;
    }
    static async getStockAlerts(branchId) {
        const filter = { isActive: true };
        if (branchId)
            filter.branchId = branchId;
        const items = await Inventory_1.Inventory.find({
            ...filter,
            $or: [
                { quantity: { $lte: CRITICAL_STOCK_QUANTITY } },
                { $expr: { $lte: ['$quantity', '$threshold'] } },
            ],
        }).sort({ quantity: 1 });
        return items.map((item) => {
            const isCritical = item.quantity <= item.threshold / 2;
            return {
                ...item.toObject(),
                alertType: isCritical ? 'critical' : 'low',
                shortage: item.threshold - item.quantity,
            };
        });
    }
    static async createInventoryItem(data) {
        const existing = await Inventory_1.Inventory.findOne({
            name: data.name,
            branchId: data.branchId,
            isActive: true,
        });
        if (existing) {
            throw new response_1.AppError(409, 'DUPLICATE', 'Inventory item with this name already exists in this branch');
        }
        const inventoryData = {
            name: data.name,
            category: data.category,
            unit: data.unit,
            quantity: data.quantity,
            threshold: data.threshold,
            unitPrice: data.unitPrice,
        };
        if (data.branchId)
            inventoryData.branchId = data.branchId;
        if (data.supplier)
            inventoryData.supplier = data.supplier;
        if (data.supplierId)
            inventoryData.supplierId = data.supplierId;
        if (data.expiryDate)
            inventoryData.expiryDate = new Date(data.expiryDate);
        const item = await Inventory_1.Inventory.create(inventoryData);
        await this.checkThresholdAndEmit(item);
        return item;
    }
    static async adjustStock(inventoryId, data, userId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const item = await Inventory_1.Inventory.findOne({ _id: inventoryId, isActive: true }).session(session);
            if (!item) {
                throw new response_1.AppError(404, 'NOT_FOUND', 'Inventory item not found');
            }
            const previousQuantity = item.quantity;
            let newQuantity;
            switch (data.type) {
                case 'replenishment':
                    newQuantity = previousQuantity + Math.abs(data.quantity);
                    break;
                case 'deduction':
                case 'waste':
                    newQuantity = previousQuantity - Math.abs(data.quantity);
                    break;
                case 'adjustment':
                    newQuantity = data.quantity;
                    break;
                default:
                    throw new response_1.AppError(400, 'INVALID_TYPE', 'Invalid movement type');
            }
            if (newQuantity < 0) {
                throw new response_1.AppError(400, 'INSUFFICIENT_STOCK', 'Insufficient stock');
            }
            item.quantity = newQuantity;
            await item.save({ session });
            const movement = await StockMovement_1.StockMovement.create([
                {
                    inventoryId: item._id,
                    type: data.type,
                    quantity: Math.abs(data.quantity),
                    previousQuantity,
                    newQuantity,
                    reason: data.reason,
                    userId,
                },
            ], { session });
            await session.commitTransaction();
            // Check threshold and emit alert
            this.checkThresholdAndEmit(item);
            return { item, movement: movement[0] };
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async incrementStock(inventoryId, quantity, userId, unitPrice, supplier, supplierId, paidSupplierPrice) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const item = await Inventory_1.Inventory.findOne({ _id: inventoryId, isActive: true }).session(session);
            if (!item) {
                throw new response_1.AppError(404, 'NOT_FOUND', 'Inventory item not found');
            }
            const previousQuantity = item.quantity;
            item.quantity = previousQuantity + quantity;
            if (unitPrice !== undefined)
                item.unitPrice = unitPrice;
            if (supplier !== undefined)
                item.supplier = supplier;
            if (supplierId !== undefined) {
                const supplierDoc = await Supplier_1.Supplier.findById(supplierId).session(session);
                if (!supplierDoc) {
                    throw new response_1.AppError(404, 'NOT_FOUND', 'Supplier not found');
                }
                item.supplierId = supplierDoc._id;
                item.supplier = supplierDoc.name;
            }
            await item.save({ session });
            const supplierAmountDue = supplierId && paidSupplierPrice !== undefined ? quantity * paidSupplierPrice : undefined;
            const movement = await StockMovement_1.StockMovement.create([
                {
                    inventoryId: item._id,
                    type: 'replenishment',
                    quantity,
                    previousQuantity,
                    newQuantity: item.quantity,
                    reason: 'Stock replenishment',
                    userId,
                    supplierId,
                    unitPrice,
                    paidSupplierPrice,
                    supplierAmountDue,
                },
            ], { session });
            if (supplierId && supplierAmountDue !== undefined && supplierAmountDue > 0) {
                const supplierDoc = await Supplier_1.Supplier.findById(supplierId).session(session);
                if (!supplierDoc) {
                    throw new response_1.AppError(404, 'NOT_FOUND', 'Supplier not found');
                }
                const previousBalance = supplierDoc.balanceDue;
                supplierDoc.balanceDue = previousBalance + supplierAmountDue;
                await supplierDoc.save({ session });
                const debtMovement = await SupplierDebtMovement_1.SupplierDebtMovement.create([
                    {
                        supplierId: supplierDoc._id,
                        type: 'purchase_debt',
                        amount: supplierAmountDue,
                        previousBalance,
                        newBalance: supplierDoc.balanceDue,
                        inventoryId: item._id,
                        stockMovementId: movement[0]._id,
                        description: `Reception ${quantity} ${item.unit} of ${item.name}`,
                        userId,
                    },
                ], { session });
                movement[0].supplierDebtMovementId = debtMovement[0]._id;
                await movement[0].save({ session });
            }
            await session.commitTransaction();
            // Invalidate stock value cache
            await this.invalidateStockValueCache();
            await this.checkThresholdAndEmit(item);
            return { item, movement: movement[0] };
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async getStockValue(branchId) {
        const cacheKey = `stockvalue:${branchId || 'all'}`;
        if ((0, redis_1.isRedisAvailable)()) {
            try {
                const cached = await redis_1.redis.get(cacheKey);
                if (cached) {
                    return JSON.parse(cached);
                }
            }
            catch {
                // Redis error, continue without cache
            }
        }
        const filter = { isActive: true };
        if (branchId)
            filter.branchId = branchId;
        const result = await Inventory_1.Inventory.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: 1 },
                    totalValue: {
                        $sum: { $multiply: ['$quantity', '$unitPrice'] },
                    },
                    belowThreshold: {
                        $sum: {
                            $cond: [{ $lte: ['$quantity', '$threshold'] }, 1, 0],
                        },
                    },
                },
            },
        ]);
        const value = result[0] || { totalItems: 0, totalValue: 0, belowThreshold: 0 };
        if ((0, redis_1.isRedisAvailable)()) {
            try {
                await redis_1.redis.set(cacheKey, JSON.stringify(value), 'EX', STOCK_VALUE_CACHE_TTL);
            }
            catch {
                // Redis error, continue without caching
            }
        }
        return value;
    }
    static async invalidateStockValueCache() {
        if (!(0, redis_1.isRedisAvailable)())
            return;
        try {
            const keys = await redis_1.redis.keys('stockvalue:*');
            if (keys.length > 0) {
                await redis_1.redis.del(...keys);
            }
        }
        catch {
            // Redis error, ignore
        }
    }
    static async getStockMovements(inventoryId, query = {}) {
        const { page = '1', limit = '20' } = query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [movements, total] = await Promise.all([
            StockMovement_1.StockMovement.find({ inventoryId })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limitNum),
            StockMovement_1.StockMovement.countDocuments({ inventoryId }),
        ]);
        return { movements, total };
    }
    static async checkThreshold(item) {
        if (item.quantity <= CRITICAL_STOCK_QUANTITY) {
            return { alertType: 'critical', shortage: Math.max(CRITICAL_STOCK_QUANTITY - item.quantity, 0) };
        }
        if (item.quantity <= item.threshold) {
            return { alertType: 'low', shortage: item.threshold - item.quantity };
        }
        return { alertType: null, shortage: 0 };
    }
    static async checkThresholdAndEmit(item) {
        const alert = await this.checkThreshold(item);
        if (alert.alertType) {
            if (alert.alertType === 'critical') {
                await notification_service_1.NotificationService.createStockCriticalNotification(item._id.toString(), item.name, item.quantity, CRITICAL_STOCK_QUANTITY);
            }
            try {
                const io = (0, socket_server_1.getIO)();
                (0, emitters_1.emitStockCritical)(io, {
                    inventoryId: item._id.toString(),
                    productName: item.name,
                    quantity: item.quantity,
                    threshold: alert.alertType === 'critical' ? CRITICAL_STOCK_QUANTITY : item.threshold,
                    alertId: `alert_${item._id}_${Date.now()}`,
                });
            }
            catch {
                // Socket not available, ignore
            }
        }
    }
}
exports.InventoryService = InventoryService;
//# sourceMappingURL=inventory.service.js.map