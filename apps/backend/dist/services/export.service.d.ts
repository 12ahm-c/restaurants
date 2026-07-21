export declare class ExportService {
    static generatePDF(data: any[], columns: {
        header: string;
        key: string;
        width?: number;
    }[], title: string, restaurantName?: string): Promise<Buffer>;
    static generateExcel(data: any[], columns: {
        header: string;
        key: string;
    }[], title: string, restaurantName?: string): Promise<Buffer>;
    static generateCSV(data: any[], columns: {
        header: string;
        key: string;
    }[]): Promise<string>;
}
//# sourceMappingURL=export.service.d.ts.map