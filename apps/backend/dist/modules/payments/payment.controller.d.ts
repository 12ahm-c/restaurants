import { Request, Response } from 'express';
export declare class PaymentController {
    static processPayment(req: Request, res: Response): Promise<void>;
    static getCashDrawer(req: Request, res: Response): Promise<void>;
    static openCashDrawer(req: Request, res: Response): Promise<void>;
    static closeCashDrawer(req: Request, res: Response): Promise<void>;
    static getPaymentsByOrder(req: Request, res: Response): Promise<void>;
    static getAllPayments(req: Request, res: Response): Promise<void>;
    static refundPayment(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=payment.controller.d.ts.map