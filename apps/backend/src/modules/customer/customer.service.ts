import { Customer, ICustomer } from '../../models/Customer';
import { LoyaltyTransaction } from '../../models/LoyaltyTransaction';
import { Order } from '../../models/Order';
import { AppError } from '../../utils/response';
import mongoose from 'mongoose';

export class CustomerService {
  static async getCustomers(query: {
    search?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ items: ICustomer[]; total: number; page: number; limit: number }> {
    const {
      search,
      page = '1',
      limit = '20',
      sortBy = 'lastName',
      sortOrder = 'asc',
    } = query;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [items, total] = await Promise.all([
      Customer.find(filter).sort(sort).skip(skip).limit(limitNum),
      Customer.countDocuments(filter),
    ]);

    return { items, total, page: pageNum, limit: limitNum };
  }

  static async getCustomerById(id: string): Promise<{
    customer: ICustomer;
    totalSpent: number;
    lastPurchaseAt: Date | null;
    totalOrders: number;
  }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'INVALID_ID', 'Invalid customer ID');
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      throw new AppError(404, 'NOT_FOUND', 'Customer not found');
    }

    const orderStats = await Order.aggregate([
      { $match: { customerId: customer._id } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: { $ifNull: ['$totalTTC', '$totalHT', 0] } },
          lastPurchaseAt: { $max: '$createdAt' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    return {
      customer,
      totalSpent: orderStats[0]?.totalSpent || 0,
      lastPurchaseAt: orderStats[0]?.lastPurchaseAt || null,
      totalOrders: orderStats[0]?.totalOrders || 0,
    };
  }

  static async createCustomer(data: {
    firstName: string;
    lastName?: string;
    phone: string;
    email?: string;
    address?: string;
    preferences?: string;
    birthDate?: string;
    branchId?: string;
    debt?: number;
  }): Promise<ICustomer> {
    const existing = await Customer.findOne({ phone: data.phone });
    if (existing) {
      throw new AppError(409, 'DUPLICATE', 'Customer with this phone number already exists');
    }

    const customerData: any = {
      firstName: data.firstName,
      lastName: data.lastName || '',
      phone: data.phone,
    };

    if (data.email) customerData.email = data.email;
    if (data.address) customerData.address = data.address;
    if (data.preferences) customerData.preferences = data.preferences;
    if (data.birthDate) customerData.birthDate = new Date(data.birthDate);
    if (data.branchId) customerData.branchId = data.branchId;
    if (data.debt !== undefined) customerData.debt = data.debt;

    const customer = await Customer.create(customerData);
    return customer;
  }

  static async updateCustomer(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      address?: string;
      preferences?: string;
      birthDate?: string;
      debt?: number;
    }
  ): Promise<ICustomer> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'INVALID_ID', 'Invalid customer ID');
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      throw new AppError(404, 'NOT_FOUND', 'Customer not found');
    }

    if (data.phone && data.phone !== customer.phone) {
      const existing = await Customer.findOne({ phone: data.phone, _id: { $ne: id } });
      if (existing) {
        throw new AppError(409, 'DUPLICATE', 'Phone number already in use');
      }
    }

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.preferences !== undefined) updateData.preferences = data.preferences;
    if (data.birthDate !== undefined) updateData.birthDate = new Date(data.birthDate);
    if (data.debt !== undefined) updateData.debt = data.debt;

    const updated = await Customer.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Customer not found');
    }
    return updated;
  }

  static async searchCustomers(query: string): Promise<ICustomer[]> {
    if (!query || query.length < 2) {
      return [];
    }

    return Customer.find({
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
      ],
    }).limit(10);
  }

  static async redeemLoyaltyPoints(
    customerId: string,
    points: number,
    orderId: string,
    userId: string
  ): Promise<{ transaction: any; customer: ICustomer; discountAmount: number; remainingPoints: number }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const customer = await Customer.findById(customerId).session(session);
      if (!customer) {
        throw new AppError(404, 'NOT_FOUND', 'Customer not found');
      }

      if (customer.loyaltyPoints < points) {
        throw new AppError(400, 'INSUFFICIENT_POINTS', 'Insufficient loyalty points');
      }

      // 1 point = 1 MRU discount
      const discountAmount = points;

      customer.loyaltyPoints -= points;
      await customer.save({ session });

      const transaction = await LoyaltyTransaction.create(
        [
          {
            customerId: customer._id,
            type: 'redeem',
            points,
            orderId,
            description: `Loyalty points redemption for ${discountAmount} MRU discount`,
            userId,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return {
        transaction: transaction[0],
        customer: customer as ICustomer,
        discountAmount,
        remainingPoints: customer.loyaltyPoints,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async earnLoyaltyPoints(
    customerId: string,
    points: number,
    orderId: string,
    userId: string
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const customer = await Customer.findById(customerId).session(session);
      if (!customer) {
        throw new AppError(404, 'NOT_FOUND', 'Customer not found');
      }

      customer.loyaltyPoints += points;
      await customer.save({ session });

      const transaction = await LoyaltyTransaction.create(
        [
          {
            customerId: customer._id,
            type: 'earn',
            points,
            orderId,
            description: `Loyalty points earned from order`,
            userId,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return transaction[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getCustomerLoyaltyHistory(
    customerId: string,
    query: { page?: string; limit?: string } = {}
  ): Promise<{ transactions: any[]; total: number }> {
    const { page = '1', limit = '20' } = query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      LoyaltyTransaction.find({ customerId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      LoyaltyTransaction.countDocuments({ customerId }),
    ]);

    return { transactions, total };
  }

  static async getCustomerPurchaseHistory(
    customerId: string,
    query: { page?: string; limit?: string } = {}
  ): Promise<{ orders: any[]; total: number }> {
    const { page = '1', limit = '20' } = query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find({ customerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments({ customerId }),
    ]);

    return { orders, total };
  }

  static async getLoyaltyRanking(limit: number = 20): Promise<ICustomer[]> {
    return Customer.find()
      .sort({ loyaltyPoints: -1 })
      .limit(limit);
  }
}
