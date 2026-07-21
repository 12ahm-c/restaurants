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
    static notifyChefsNewOrder(orderId: string, orderNumber: string, tableName: string, items: Array<{
        name: string;
        quantity: number;
    }>): Promise<void>;
    static notifyServersOrderReady(orderId: string, orderNumber: string, tableName: string): Promise<void>;
    static notifyPaymentReceived(orderId: string, orderNumber: string, amount: number, method: string): Promise<void>;
    static notifyOrderServed(orderId: string, orderNumber: string, tableName: string): Promise<void>;
    static createStockCriticalNotification(inventoryId: string, productName: string, quantity: number, threshold: number): Promise<void>;
    static notifyManagersMorningReminder(): Promise<void>;
    static notifyManagersDailySummary(referenceDate?: Date): Promise<void>;
}
//# sourceMappingURL=notification.service.d.ts.map