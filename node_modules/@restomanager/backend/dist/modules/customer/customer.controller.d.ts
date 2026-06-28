import { Request, Response } from 'express';
export declare class CustomerController {
    static getCustomers(req: Request, res: Response): Promise<void>;
    static getCustomerById(req: Request, res: Response): Promise<void>;
    static createCustomer(req: Request, res: Response): Promise<void>;
    static updateCustomer(req: Request, res: Response): Promise<void>;
    static searchCustomers(req: Request, res: Response): Promise<void>;
    static redeemLoyaltyPoints(req: Request, res: Response): Promise<void>;
    static getCustomerLoyaltyHistory(req: Request, res: Response): Promise<void>;
    static getCustomerPurchaseHistory(req: Request, res: Response): Promise<void>;
    static getLoyaltyRanking(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=customer.controller.d.ts.map