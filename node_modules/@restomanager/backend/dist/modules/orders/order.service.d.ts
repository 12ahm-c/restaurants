import { IOrder, OrderStatus } from '../../models/Order';
import { IOrderItem } from '../../models/OrderItem';
export interface CreateOrderInput {
    tableId?: string;
    customerId?: string;
    type: 'dine-in' | 'takeaway' | 'delivery';
    items: Array<{
        productId: string;
        quantity: number;
        variant?: string;
        options?: Array<{
            name: string;
            price: number;
        }>;
        notes?: string;
    }>;
    notes?: string;
}
export declare class OrderService {
    static createOrder(userId: string, input: CreateOrderInput): Promise<{
        order: IOrder;
        items: IOrderItem[];
        kitchenQueueId: string;
    }>;
    static getOrders(filters: {
        status?: OrderStatus;
        tableId?: string;
        customerId?: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        orders: IOrder[];
        total: number;
    }>;
    static getActiveOrders(userId: string): Promise<IOrder[]>;
    static getOrderById(id: string): Promise<{
        order: IOrder;
        items: IOrderItem[];
    }>;
    static updateOrderStatus(id: string, status: OrderStatus): Promise<IOrder>;
    static cancelOrder(orderId: string, reason: string): Promise<void>;
}
//# sourceMappingURL=order.service.d.ts.map