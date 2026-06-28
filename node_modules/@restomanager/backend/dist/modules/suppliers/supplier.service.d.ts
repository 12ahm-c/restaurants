import { ISupplier } from '../../models/Supplier';
import { ISupplierDebtMovement } from '../../models/SupplierDebtMovement';
export declare class SupplierService {
    static getSuppliers(search?: string): Promise<ISupplier[]>;
    static createSupplier(data: {
        name: string;
        phone?: string;
        email?: string;
    }): Promise<ISupplier>;
    static getSupplierMovements(supplierId: string): Promise<ISupplierDebtMovement[]>;
}
//# sourceMappingURL=supplier.service.d.ts.map