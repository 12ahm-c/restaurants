import { IInventory } from '../../models/Inventory';
import { IStockMovement } from '../../models/StockMovement';
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
export declare class InventoryService {
    static getInventoryItems(query: {
        branchId?: string;
        category?: string;
        belowThreshold?: string;
        search?: string;
        page?: string;
        limit?: string;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<{
        items: IInventory[];
        total: number;
        page: number;
        limit: number;
    }>;
    static getInventoryById(id: string): Promise<IInventory>;
    static getStockAlerts(branchId?: string): Promise<InventoryAlert[]>;
    static createInventoryItem(data: {
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
    }): Promise<IInventory>;
    static adjustStock(inventoryId: string, data: {
        quantity: number;
        type: 'adjustment' | 'replenishment' | 'deduction' | 'waste';
        reason: string;
    }, userId: string): Promise<{
        item: IInventory;
        movement: IStockMovement;
    }>;
    static incrementStock(inventoryId: string, quantity: number, userId: string, unitPrice?: number, supplier?: string, supplierId?: string, paidSupplierPrice?: number): Promise<{
        item: IInventory;
        movement: IStockMovement;
    }>;
    static getStockValue(branchId?: string): Promise<{
        totalItems: number;
        totalValue: number;
        belowThreshold: number;
    }>;
    static invalidateStockValueCache(): Promise<void>;
    static getStockMovements(inventoryId: string, query?: {
        page?: string;
        limit?: string;
    }): Promise<{
        movements: IStockMovement[];
        total: number;
    }>;
    static checkThreshold(item: IInventory): Promise<{
        alertType: 'critical' | 'low' | null;
        shortage: number;
    }>;
    static checkThresholdAndEmit(item: IInventory): Promise<void>;
}
//# sourceMappingURL=inventory.service.d.ts.map