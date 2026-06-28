import { IKitchenQueue, KitchenStatus } from '../../models/KitchenQueue';
export interface KitchenQueueDTO {
    _id: string;
    orderId: string;
    status: KitchenStatus;
    priority: number;
    startTime?: Date;
    endTime?: Date;
    createdAt: Date;
    updatedAt: Date;
    order?: {
        _id: string;
        type: string;
        status: string;
        totalTTC: number;
        notes?: string;
        createdAt: Date;
    };
    table?: {
        _id: string;
        name: string;
        zone: string;
    };
    items?: Array<{
        productId: string;
        productName: string;
        quantity: number;
        notes?: string;
    }>;
}
export declare class KitchenService {
    static getQueue(filters?: {
        status?: KitchenStatus;
        priority?: number;
    }): Promise<KitchenQueueDTO[]>;
    static getPriorityQueue(): Promise<KitchenQueueDTO[]>;
    static startPreparation(id: string): Promise<IKitchenQueue>;
    static markReady(id: string): Promise<IKitchenQueue>;
    static cancelOrder(orderId: string, reason: string): Promise<void>;
}
//# sourceMappingURL=kitchen.service.d.ts.map