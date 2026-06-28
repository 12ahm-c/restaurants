import { Request, Response } from 'express';
export declare class KitchenController {
    static getQueue(req: Request, res: Response): Promise<void>;
    static getPriorityQueue(_req: Request, res: Response): Promise<void>;
    static startPreparation(req: Request, res: Response): Promise<void>;
    static markReady(req: Request, res: Response): Promise<void>;
    static cancelOrder(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=kitchen.controller.d.ts.map