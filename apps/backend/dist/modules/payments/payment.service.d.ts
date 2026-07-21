import { IPayment, PaymentMethod } from '../../models/Payment';
import { ICashDrawer } from '../../models/CashDrawer';
interface ProcessPaymentInput {
    orderId: string;
    amount: number;
    method: PaymentMethod;
    cashGiven?: number;
    userId: string;
}
export declare class PaymentService {
    static processPayment(input: ProcessPaymentInput): Promise<{
        paymentId: string;
        changeAmount: number;
        orderStatus: string;
        loyaltyPointsEarned: number;
    }>;
    static getCashDrawer(branchId: string): Promise<ICashDrawer | null>;
    static openCashDrawer(branchId: string, openingBalance: number, userId: string): Promise<ICashDrawer>;
    static closeCashDrawer(drawerId: string, declaredBalance: number, userId: string): Promise<{
        expectedBalance: number;
        declaredBalance: number;
        difference: number;
        cashSales: number;
    }>;
    static getPaymentsByOrder(orderId: string): Promise<IPayment[]>;
    static getAllPayments(filters: {
        method?: PaymentMethod;
        status?: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        payments: IPayment[];
        total: number;
    }>;
    static refundPayment(paymentId: string): Promise<IPayment>;
}
export {};
//# sourceMappingURL=payment.service.d.ts.map