"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const Customer_1 = require("../../models/Customer");
const LoyaltyTransaction_1 = require("../../models/LoyaltyTransaction");
const Order_1 = require("../../models/Order");
const response_1 = require("../../utils/response");
const mongoose_1 = __importDefault(require("mongoose"));
class CustomerService {
    static async getCustomers(query) {
        const { search, page = '1', limit = '20', sortBy = 'lastName', sortOrder = 'asc', } = query;
        const filter = {};
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
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
        const [items, total] = await Promise.all([
            Customer_1.Customer.find(filter).sort(sort).skip(skip).limit(limitNum),
            Customer_1.Customer.countDocuments(filter),
        ]);
        return { items, total, page: pageNum, limit: limitNum };
    }
    static async getCustomerById(id) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new response_1.AppError(400, 'INVALID_ID', 'Invalid customer ID');
        }
        const customer = await Customer_1.Customer.findById(id);
        if (!customer) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Customer not found');
        }
        const orderStats = await Order_1.Order.aggregate([
            { $match: { customerId: customer._id } },
            {
                $group: {
                    _id: null,
                    totalSpent: { $sum: '$totalAmount' },
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
    static async createCustomer(data) {
        const existing = await Customer_1.Customer.findOne({ phone: data.phone });
        if (existing) {
            throw new response_1.AppError(409, 'DUPLICATE', 'Customer with this phone number already exists');
        }
        const customerData = {
            firstName: data.firstName,
            lastName: data.lastName || '',
            phone: data.phone,
        };
        if (data.email)
            customerData.email = data.email;
        if (data.address)
            customerData.address = data.address;
        if (data.preferences)
            customerData.preferences = data.preferences;
        if (data.birthDate)
            customerData.birthDate = new Date(data.birthDate);
        if (data.branchId)
            customerData.branchId = data.branchId;
        const customer = await Customer_1.Customer.create(customerData);
        return customer;
    }
    static async updateCustomer(id, data) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new response_1.AppError(400, 'INVALID_ID', 'Invalid customer ID');
        }
        const customer = await Customer_1.Customer.findById(id);
        if (!customer) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Customer not found');
        }
        if (data.phone && data.phone !== customer.phone) {
            const existing = await Customer_1.Customer.findOne({ phone: data.phone, _id: { $ne: id } });
            if (existing) {
                throw new response_1.AppError(409, 'DUPLICATE', 'Phone number already in use');
            }
        }
        const updateData = {};
        if (data.firstName !== undefined)
            updateData.firstName = data.firstName;
        if (data.lastName !== undefined)
            updateData.lastName = data.lastName;
        if (data.phone !== undefined)
            updateData.phone = data.phone;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.address !== undefined)
            updateData.address = data.address;
        if (data.preferences !== undefined)
            updateData.preferences = data.preferences;
        if (data.birthDate !== undefined)
            updateData.birthDate = new Date(data.birthDate);
        const updated = await Customer_1.Customer.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Customer not found');
        }
        return updated;
    }
    static async searchCustomers(query) {
        if (!query || query.length < 2) {
            return [];
        }
        return Customer_1.Customer.find({
            $or: [
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } },
            ],
        }).limit(10);
    }
    static async redeemLoyaltyPoints(customerId, points, orderId, userId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const customer = await Customer_1.Customer.findById(customerId).session(session);
            if (!customer) {
                throw new response_1.AppError(404, 'NOT_FOUND', 'Customer not found');
            }
            if (customer.loyaltyPoints < points) {
                throw new response_1.AppError(400, 'INSUFFICIENT_POINTS', 'Insufficient loyalty points');
            }
            // 1 point = 1 MRU discount
            const discountAmount = points;
            customer.loyaltyPoints -= points;
            await customer.save({ session });
            const transaction = await LoyaltyTransaction_1.LoyaltyTransaction.create([
                {
                    customerId: customer._id,
                    type: 'redeem',
                    points,
                    orderId,
                    description: `Loyalty points redemption for ${discountAmount} MRU discount`,
                    userId,
                },
            ], { session });
            await session.commitTransaction();
            return {
                transaction: transaction[0],
                customer: customer,
                discountAmount,
                remainingPoints: customer.loyaltyPoints,
            };
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async earnLoyaltyPoints(customerId, points, orderId, userId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const customer = await Customer_1.Customer.findById(customerId).session(session);
            if (!customer) {
                throw new response_1.AppError(404, 'NOT_FOUND', 'Customer not found');
            }
            customer.loyaltyPoints += points;
            await customer.save({ session });
            const transaction = await LoyaltyTransaction_1.LoyaltyTransaction.create([
                {
                    customerId: customer._id,
                    type: 'earn',
                    points,
                    orderId,
                    description: `Loyalty points earned from order`,
                    userId,
                },
            ], { session });
            await session.commitTransaction();
            return transaction[0];
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async getCustomerLoyaltyHistory(customerId, query = {}) {
        const { page = '1', limit = '20' } = query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [transactions, total] = await Promise.all([
            LoyaltyTransaction_1.LoyaltyTransaction.find({ customerId })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            LoyaltyTransaction_1.LoyaltyTransaction.countDocuments({ customerId }),
        ]);
        return { transactions, total };
    }
    static async getCustomerPurchaseHistory(customerId, query = {}) {
        const { page = '1', limit = '20' } = query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [orders, total] = await Promise.all([
            Order_1.Order.find({ customerId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Order_1.Order.countDocuments({ customerId }),
        ]);
        return { orders, total };
    }
    static async getLoyaltyRanking(limit = 20) {
        return Customer_1.Customer.find()
            .sort({ loyaltyPoints: -1 })
            .limit(limit);
    }
}
exports.CustomerService = CustomerService;
//# sourceMappingURL=customer.service.js.map