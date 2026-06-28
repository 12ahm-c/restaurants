import { Request, Response } from 'express';
export declare class OrderController {
    static createOrder(req: Request, res: Response): Promise<void>;
    static getOrders(req: Request, res: Response): Promise<void>;
    static getActiveOrders(req: Request, res: Response): Promise<void>;
    static getOrderById(req: Request, res: Response): Promise<void>;
    static updateOrderStatus(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=order.controller.d.ts.map