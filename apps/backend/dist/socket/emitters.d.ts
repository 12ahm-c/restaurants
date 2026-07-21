import { Server as SocketIOServer } from 'socket.io';
export interface NewOrderEvent {
    orderId: string;
    tentName: string;
    items: Array<{
        name: string;
        quantity: number;
    }>;
    priority: number;
    timestamp: Date;
}
export interface OrderStatusUpdateEvent {
    orderId: string;
    status: string;
    tentName: string;
    timestamp: Date;
}
export interface OrderCancelledEvent {
    orderId: string;
    reason: string;
    timestamp: Date;
}
export interface SaleNewEvent {
    orderId: string;
    totalAmount: number;
    cashierName: string;
    timestamp: Date;
}
export interface StockCriticalEvent {
    inventoryId: string;
    productName: string;
    quantity: number;
    threshold: number;
    alertId: string;
}
export interface DashboardUpdateEvent {
    dailyOrdersCount: number;
    dailyRevenue: number;
    activeTables: number;
    pendingKitchenOrders: number;
    alertsCount: number;
}
export interface CustomerPointsEarnedEvent {
    customerId: string;
    customerName: string;
    points: number;
    totalPoints: number;
    orderId: string;
}
export interface CustomerPointsRedeemedEvent {
    customerId: string;
    customerName: string;
    points: number;
    discountAmount: number;
    remainingPoints: number;
}
export interface NotificationNewEvent {
    userId: string;
    notificationId: string;
    title: string;
    message: string;
    type: string;
    createdAt: Date;
    entity?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
}
export declare function emitNewOrder(io: SocketIOServer, data: NewOrderEvent): void;
export declare function emitOrderStatusUpdate(io: SocketIOServer, data: OrderStatusUpdateEvent, serverId?: string): void;
export declare function emitOrderCancelled(io: SocketIOServer, data: OrderCancelledEvent): void;
export declare function emitSaleNew(io: SocketIOServer, data: SaleNewEvent): void;
export declare function emitStockCritical(io: SocketIOServer, data: StockCriticalEvent): void;
export declare function emitDashboardUpdate(io: SocketIOServer, data: DashboardUpdateEvent): void;
export declare function emitCustomerPointsEarned(io: SocketIOServer, data: CustomerPointsEarnedEvent): void;
export declare function emitCustomerPointsRedeemed(io: SocketIOServer, data: CustomerPointsRedeemedEvent): void;
export declare function emitNotificationNew(io: SocketIOServer, data: NotificationNewEvent): void;
//# sourceMappingURL=emitters.d.ts.map