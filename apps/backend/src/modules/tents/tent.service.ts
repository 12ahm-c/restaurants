import { Tent, ITent, TentStatus, TentSize } from '../../models/Tent';
import { Order } from '../../models/Order';
import { AppError } from '../../utils/response';

export class TentService {
  static async getTents(filters: { status?: TentStatus; size?: TentSize }): Promise<ITent[]> {
    const query: Record<string, unknown> = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.size) {
      query.size = filters.size;
    }

    return Tent.find(query).sort({ tentNumber: 1 });
  }

  static async getTentStatusSummary(): Promise<{
    free: number;
    occupied: number;
    reserved: number;
    cleaning: number;
    total: number;
  }> {
    const [free, occupied, reserved, cleaning, total] = await Promise.all([
      Tent.countDocuments({ status: 'free' }),
      Tent.countDocuments({ status: 'occupied' }),
      Tent.countDocuments({ status: 'reserved' }),
      Tent.countDocuments({ status: 'cleaning' }),
      Tent.countDocuments(),
    ]);

    return { free, occupied, reserved, cleaning, total };
  }

  static async getTentById(id: string): Promise<ITent> {
    const tent = await Tent.findById(id);

    if (!tent) {
      throw new AppError(404, 'NOT_FOUND', 'Tent not found');
    }

    return tent;
  }

  static async updateTentStatus(
    id: string,
    status: TentStatus,
    serverId?: string
  ): Promise<ITent> {
    const tent = await Tent.findById(id);

    if (!tent) {
      throw new AppError(404, 'NOT_FOUND', 'Tent not found');
    }

    tent.status = status;
    if (serverId) {
      tent.serverId = tent.serverId || tent.serverId;
    }

    await tent.save();
    return tent;
  }

  static async markTentEmpty(id: string): Promise<ITent> {
    const tent = await Tent.findById(id);

    if (!tent) {
      throw new AppError(404, 'NOT_FOUND', 'Tent not found');
    }

    if (tent.status === 'free') {
      throw new AppError(409, 'INVALID_STATE', 'Tent is already free');
    }

    if (tent.currentOrderId) {
      await Order.findByIdAndUpdate(tent.currentOrderId, { status: 'completed' });
    }

    tent.status = 'free';
    tent.currentOrderId = undefined;
    tent.serverId = undefined;
    tent.isEmpty = true;
    tent.lastEmptiedAt = new Date();
    await tent.save();

    return tent;
  }

  static async createTent(data: {
    tentNumber: number;
    size: TentSize;
    position: { x: number; y: number };
  }): Promise<ITent> {
    const existing = await Tent.findOne({ tentNumber: data.tentNumber });
    if (existing) {
      throw new AppError(409, 'DUPLICATE', 'Tent number already exists');
    }

    return Tent.create({
      ...data,
      status: 'free',
      isEmpty: true,
    });
  }
}
