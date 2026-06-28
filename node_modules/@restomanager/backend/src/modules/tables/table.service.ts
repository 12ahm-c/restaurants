import { Table, ITable, TableStatus } from '../../models/Table';
import { Order } from '../../models/Order';
import { AppError } from '../../utils/response';

export class TableService {
  static async getTables(filters: { status?: TableStatus; zone?: string }): Promise<ITable[]> {
    const query: Record<string, unknown> = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.zone) {
      query.zone = filters.zone;
    }

    return Table.find(query).sort({ name: 1 });
  }

  static async getTableStatusSummary(): Promise<{
    free: number;
    occupied: number;
    reserved: number;
    inService: number;
    total: number;
  }> {
    const [free, occupied, reserved, inService, total] = await Promise.all([
      Table.countDocuments({ status: 'free' }),
      Table.countDocuments({ status: 'occupied' }),
      Table.countDocuments({ status: 'reserved' }),
      Table.countDocuments({ status: 'in-service' }),
      Table.countDocuments(),
    ]);

    return { free, occupied, reserved, inService, total };
  }

  static async getTableById(id: string): Promise<ITable> {
    const table = await Table.findById(id);

    if (!table) {
      throw new AppError(404, 'NOT_FOUND', 'Table not found');
    }

    return table;
  }

  static async updateTableStatus(
    id: string,
    status: TableStatus,
    serverId?: string
  ): Promise<ITable> {
    const table = await Table.findById(id);

    if (!table) {
      throw new AppError(404, 'NOT_FOUND', 'Table not found');
    }

    table.status = status;
    if (serverId) {
      table.serverId = table.serverId || table.serverId;
    }

    await table.save();
    return table;
  }

  static async clearTable(id: string): Promise<ITable> {
    const table = await Table.findById(id);

    if (!table) {
      throw new AppError(404, 'NOT_FOUND', 'Table not found');
    }

    if (table.status === 'free') {
      throw new AppError(409, 'INVALID_STATE', 'Table is already free');
    }

    if (table.currentOrderId) {
      await Order.findByIdAndUpdate(table.currentOrderId, { status: 'completed' });
    }

    table.status = 'free';
    table.currentOrderId = undefined;
    table.serverId = undefined;
    await table.save();

    return table;
  }

  static async createTable(data: {
    name: string;
    capacity: number;
    zone: string;
    position: { x: number; y: number };
  }): Promise<ITable> {
    return Table.create({
      ...data,
      status: 'free',
    });
  }
}
