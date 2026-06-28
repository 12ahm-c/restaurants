import mongoose from 'mongoose';
import { Supplier, ISupplier } from '../../models/Supplier';
import { SupplierDebtMovement, ISupplierDebtMovement } from '../../models/SupplierDebtMovement';
import { AppError } from '../../utils/response';

export class SupplierService {
  static async getSuppliers(search?: string): Promise<ISupplier[]> {
    const filter: Record<string, unknown> = { isActive: true };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    return Supplier.find(filter).sort({ name: 1 });
  }

  static async createSupplier(data: {
    name: string;
    phone?: string;
    email?: string;
  }): Promise<ISupplier> {
    const existing = await Supplier.findOne({ name: data.name.trim(), isActive: true });
    if (existing) {
      throw new AppError(409, 'DUPLICATE', 'Supplier already exists');
    }

    return Supplier.create({
      name: data.name.trim(),
      phone: data.phone,
      email: data.email,
    });
  }

  static async getSupplierMovements(supplierId: string): Promise<ISupplierDebtMovement[]> {
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      throw new AppError(400, 'INVALID_ID', 'Invalid supplier ID');
    }

    return SupplierDebtMovement.find({ supplierId }).sort({ createdAt: -1 }).limit(100);
  }
}
