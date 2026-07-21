import { Request, Response } from 'express';
export declare class TableController {
    static getTables(req: Request, res: Response): Promise<void>;
    static getTableStatusSummary(_req: Request, res: Response): Promise<void>;
    static getTableById(req: Request, res: Response): Promise<void>;
    static updateTableStatus(req: Request, res: Response): Promise<void>;
    static clearTable(req: Request, res: Response): Promise<void>;
    static createTable(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=table.controller.d.ts.map