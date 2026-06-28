import { INotification, NotificationType } from '../../models/Notification';
export declare class NotificationService {
    static createNotification(userId: string, title: string, message: string, type: NotificationType, entity?: string, entityId?: string, metadata?: Record<string, unknown>): Promise<INotification>;
    static getNotifications(userId: string, page?: number, limit?: number, unreadOnly?: boolean): Promise<{
        notifications: INotification[];
        total: number;
        unreadCount: number;
    }>;
    static markAsRead(userId: string, notificationId: string): Promise<INotification | null>;
    static markAllAsRead(userId: string): Promise<number>;
    static createOrderReadyNotification(orderId: string, tableNumber: number, userId: string): Promise<void>;
    static createStockCriticalNotification(inventoryId: string, productName: string, quantity: number, threshold: number): Promise<void>;
    static createLoyaltyEarnedNotification(customerId: string, customerName: string, points: number, orderId: string): Promise<void>;
    static createPaymentReceivedNotification(orderId: string, amount: number, method: string, userId: string): Promise<void>;
}
//# sourceMappingURL=notification.service.d.ts.map