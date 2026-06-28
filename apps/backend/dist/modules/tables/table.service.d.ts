import { ITable, TableStatus } from '../../models/Table';
export declare class TableService {
    static getTables(filters: {
        status?: TableStatus;
        zone?: string;
    }): Promise<ITable[]>;
    static getTableStatusSummary(): Promise<{
        free: number;
        occupied: number;
        reserved: number;
        inService: number;
        total: number;
    }>;
    static getTableById(id: string): Promise<ITable>;
    static updateTableStatus(id: string, status: TableStatus, serverId?: string): Promise<ITable>;
    static createTable(data: {
        name: string;
        capacity: number;
        zone: string;
        position: {
            x: number;
            y: number;
        };
    }): Promise<ITable>;
}
//# sourceMappingURL=table.service.d.ts.map