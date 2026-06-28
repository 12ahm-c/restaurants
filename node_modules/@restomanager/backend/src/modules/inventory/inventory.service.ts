import { Inventory, IInventory } from '../../models/Inventory';
import { StockMovement, IStockMovement } from '../../models/StockMovement';
import { Supplier } from '../../models/Supplier';
import { SupplierDebtMovement } from '../../models/SupplierDebtMovement';
import { AppError } from '../../utils/response';
import { redis, isRedisAvailable } from '../../config/redis';
import { getIO } from '../../socket/socket.server';
import { emitStockCritical } from '../../socket/emitters';
import { NotificationService } from '../notifications/notification.service';
import mongoose from 'mongoose';

const STOCK_VALUE_CACHE_TTL = 300; // 5 minutes
const CRITICAL_STOCK_QUANTITY = 3;

export interface InventoryAlert {
  _id: any;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  threshold: number;
  unitPrice: number;
  supplier?: string;
  expiryDate?: Date;
  branchId?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  alertType: 'critical' | 'low';
  shortage: number;
}

export class InventoryService {
  static async getInventoryItems(query: {
    branchId?: string;
    category?: string;
    belowThreshold?: string;
    search?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ items: IInventory[]; total: number; page: number; limit: number }> {
    const {
      branchId,
      category,
      belowThreshold,
      search,
      page = '1',
      limit = '20',
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const filter: any = { isActive: true };

    if (branchId) filter.branchId = branchId;
    if (category) filter.category = category;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (belowThreshold === 'true') {
      filter.$expr = { $lte: ['$quantity', '$threshold'] };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [items, total] = await Promise.all([
      Inventory.find(filter).sort(sort).skip(skip).limit(limitNum),
      Inventory.countDocuments(filter),
    ]);

    return { items, total, page: pageNum, limit: limitNum };
  }

  static async getInventoryById(id: string): Promise<IInventory> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'INVALID_ID', 'Invalid inventory ID');
    }

    const item = await Inventory.findOne({ _id: id, isActive: true });
    if (!item) {
      throw new AppError(404, 'NOT_FOUND', 'Inventory item not found');
    }

    return item;
  }

  static async getStockAlerts(branchId?: string): Promise<InventoryAlert[]> {
    const filter: any = { isActive: true };
    if (branchId) filter.branchId = branchId;

    const items = await Inventory.find({
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

  static async createInventoryItem(data: {
    name: string;
    category: string;
    unit: string;
    quantity: number;
    threshold: number;
    unitPrice: number;
    branchId?: string;
    supplier?: string;
    supplierId?: string;
    expiryDate?: string;
  }): Promise<IInventory> {
    const existing = await Inventory.findOne({
      name: data.name,
      branchId: data.branchId,
      isActive: true,
    });
    if (existing) {
      throw new AppError(409, 'DUPLICATE', 'Inventory item with this name already exists in this branch');
    }

    const inventoryData: any = {
      name: data.name,
      category: data.category,
      unit: data.unit,
      quantity: data.quantity,
      threshold: data.threshold,
      unitPrice: data.unitPrice,
    };

    if (data.branchId) inventoryData.branchId = data.branchId;
    if (data.supplier) inventoryData.supplier = data.supplier;
    if (data.supplierId) inventoryData.supplierId = data.supplierId;
    if (data.expiryDate) inventoryData.expiryDate = new Date(data.expiryDate);

    const item = await Inventory.create(inventoryData);
    await this.checkThresholdAndEmit(item);
    return item;
  }

  static async adjustStock(
    inventoryId: string,
    data: { quantity: number; type: 'adjustment' | 'replenishment' | 'deduction' | 'waste'; reason: string },
    userId: string
  ): Promise<{ item: IInventory; movement: IStockMovement }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const item = await Inventory.findOne({ _id: inventoryId, isActive: true }).session(session);
      if (!item) {
        throw new AppError(404, 'NOT_FOUND', 'Inventory item not found');
      }

      const previousQuantity = item.quantity;
      let newQuantity: number;

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
          throw new AppError(400, 'INVALID_TYPE', 'Invalid movement type');
      }

      if (newQuantity < 0) {
        throw new AppError(400, 'INSUFFICIENT_STOCK', 'Insufficient stock');
      }

      item.quantity = newQuantity;
      await item.save({ session });

      const movement = await StockMovement.create(
        [
          {
            inventoryId: item._id,
            type: data.type,
            quantity: Math.abs(data.quantity),
            previousQuantity,
            newQuantity,
            reason: data.reason,
            userId,
          },
        ],
        { session }
      );

      await session.commitTransaction();

      // Check threshold and emit alert
      this.checkThresholdAndEmit(item);

      return { item, movement: movement[0] };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async incrementStock(
    inventoryId: string,
    quantity: number,
    userId: string,
    unitPrice?: number,
    supplier?: string,
    supplierId?: string,
    paidSupplierPrice?: number
  ): Promise<{ item: IInventory; movement: IStockMovement }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const item = await Inventory.findOne({ _id: inventoryId, isActive: true }).session(session);
      if (!item) {
        throw new AppError(404, 'NOT_FOUND', 'Inventory item not found');
      }

      const previousQuantity = item.quantity;
      item.quantity = previousQuantity + quantity;

      if (unitPrice !== undefined) item.unitPrice = unitPrice;
      if (supplier !== undefined) item.supplier = supplier;
      if (supplierId !== undefined) {
        const supplierDoc = await Supplier.findById(supplierId).session(session);
        if (!supplierDoc) {
          throw new AppError(404, 'NOT_FOUND', 'Supplier not found');
        }
        item.supplierId = supplierDoc._id;
        item.supplier = supplierDoc.name;
      }

      await item.save({ session });

      const supplierAmountDue =
        supplierId && paidSupplierPrice !== undefined ? quantity * paidSupplierPrice : undefined;

      const movement = await StockMovement.create(
        [
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
        ],
        { session }
      );

      if (supplierId && supplierAmountDue !== undefined && supplierAmountDue > 0) {
        const supplierDoc = await Supplier.findById(supplierId).session(session);
        if (!supplierDoc) {
          throw new AppError(404, 'NOT_FOUND', 'Supplier not found');
        }

        const previousBalance = supplierDoc.balanceDue;
        supplierDoc.balanceDue = previousBalance + supplierAmountDue;
        await supplierDoc.save({ session });

        const debtMovement = await SupplierDebtMovement.create(
          [
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
          ],
          { session }
        );

        movement[0].supplierDebtMovementId = debtMovement[0]._id;
        await movement[0].save({ session });
      }

      await session.commitTransaction();

      // Invalidate stock value cache
      await this.invalidateStockValueCache();
      await this.checkThresholdAndEmit(item);

      return { item, movement: movement[0] };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getStockValue(branchId?: string): Promise<{
    totalItems: number;
    totalValue: number;
    belowThreshold: number;
  }> {
    const cacheKey = `stockvalue:${branchId || 'all'}`;

    if (isRedisAvailable()) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
        // Redis error, continue without cache
      }
    }

    const filter: any = { isActive: true };
    if (branchId) filter.branchId = branchId;

    const result = await Inventory.aggregate([
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

    if (isRedisAvailable()) {
      try {
        await redis.set(cacheKey, JSON.stringify(value), 'EX', STOCK_VALUE_CACHE_TTL);
      } catch {
        // Redis error, continue without caching
      }
    }

    return value;
  }

  static async invalidateStockValueCache(): Promise<void> {
    if (!isRedisAvailable()) return;
    
    try {
      const keys = await redis.keys('stockvalue:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // Redis error, ignore
    }
  }

  static async getStockMovements(
    inventoryId: string,
    query: { page?: string; limit?: string } = {}
  ): Promise<{ movements: IStockMovement[]; total: number }> {
    const { page = '1', limit = '20' } = query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [movements, total] = await Promise.all([
      StockMovement.find({ inventoryId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
      StockMovement.countDocuments({ inventoryId }),
    ]);

    return { movements, total };
  }

  static async checkThreshold(item: IInventory): Promise<{ alertType: 'critical' | 'low' | null; shortage: number }> {
    if (item.quantity <= CRITICAL_STOCK_QUANTITY) {
      return { alertType: 'critical', shortage: Math.max(CRITICAL_STOCK_QUANTITY - item.quantity, 0) };
    }
    if (item.quantity <= item.threshold) {
      return { alertType: 'low', shortage: item.threshold - item.quantity };
    }
    return { alertType: null, shortage: 0 };
  }

  static async checkThresholdAndEmit(item: IInventory): Promise<void> {
    const alert = await this.checkThreshold(item);
    if (alert.alertType) {
      if (alert.alertType === 'critical') {
        await NotificationService.createStockCriticalNotification(
          item._id.toString(),
          item.name,
          item.quantity,
          CRITICAL_STOCK_QUANTITY
        );
      }

      try {
        const io = getIO();
        emitStockCritical(io, {
          inventoryId: item._id.toString(),
          productName: item.name,
          quantity: item.quantity,
          threshold: alert.alertType === 'critical' ? CRITICAL_STOCK_QUANTITY : item.threshold,
          alertId: `alert_${item._id}_${Date.now()}`,
        });
      } catch {
        // Socket not available, ignore
      }
    }
  }
}
