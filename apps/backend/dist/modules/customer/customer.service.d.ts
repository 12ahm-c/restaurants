import { ICustomer } from '../../models/Customer';
export declare class CustomerService {
    static getCustomers(query: {
        search?: string;
        page?: string;
        limit?: string;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<{
        items: ICustomer[];
        total: number;
        page: number;
        limit: number;
    }>;
    static getCustomerById(id: string): Promise<{
        customer: ICustomer;
        totalSpent: number;
        lastPurchaseAt: Date | null;
        totalOrders: number;
    }>;
    static createCustomer(data: {
        firstName: string;
        lastName?: string;
        phone: string;
        email?: string;
        address?: string;
        preferences?: string;
        birthDate?: string;
        branchId?: string;
    }): Promise<ICustomer>;
    static updateCustomer(id: string, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        email?: string;
        address?: string;
        preferences?: string;
        birthDate?: string;
    }): Promise<ICustomer>;
    static searchCustomers(query: string): Promise<ICustomer[]>;
    static redeemLoyaltyPoints(customerId: string, points: number, orderId: string, userId: string): Promise<{
        transaction: any;
        customer: ICustomer;
        discountAmount: number;
        remainingPoints: number;
    }>;
    static earnLoyaltyPoints(customerId: string, points: number, orderId: string, userId: string): Promise<any>;
    static getCustomerLoyaltyHistory(customerId: string, query?: {
        page?: string;
        limit?: string;
    }): Promise<{
        transactions: any[];
        total: number;
    }>;
    static getCustomerPurchaseHistory(customerId: string, query?: {
        page?: string;
        limit?: string;
    }): Promise<{
        orders: any[];
        total: number;
    }>;
    static getLoyaltyRanking(limit?: number): Promise<ICustomer[]>;
}
//# sourceMappingURL=customer.service.d.ts.map