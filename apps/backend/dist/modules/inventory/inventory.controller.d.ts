import { Request, Response } from 'express';
export declare class InventoryController {
    static getInventory(req: Request, res: Response): Promise<void>;
    static getInventoryById(req: Request, res: Response): Promise<void>;
    static getStockAlerts(req: Request, res: Response): Promise<void>;
    static createInventory(req: Request, res: Response): Promise<void>;
    static adjustStock(req: Request, res: Response): Promise<void>;
    static incrementStock(req: Request, res: Response): Promise<void>;
    static getStockValue(req: Request, res: Response): Promise<void>;
    static getStockMovements(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=inventory.controller.d.ts.map