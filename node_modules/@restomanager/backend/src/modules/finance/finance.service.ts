import { Expense, IExpense, ExpenseCategory } from '../../models/Expense';
import { Payment } from '../../models/Payment';
import { AppError } from '../../utils/response';

export class FinanceService {
  static async createExpense(data: {
    description: string;
    amount: number;
    category: ExpenseCategory;
    vendor?: string;
    paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'check';
    notes?: string;
    userId: string;
    branchId?: string;
    date?: string;
    isRecurring?: boolean;
    recurringPeriod?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  }): Promise<IExpense> {
    return Expense.create({
      ...data,
      userId: data.userId,
      date: data.date ? new Date(data.date) : new Date(),
    });
  }

  static async getExpenses(filters: {
    category?: ExpenseCategory;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ expenses: IExpense[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.from || filters.to) {
      query.date = {};
      if (filters.from) {
        (query.date as Record<string, unknown>).$gte = new Date(filters.from);
      }
      if (filters.to) {
        (query.date as Record<string, unknown>).$lte = new Date(filters.to);
      }
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100);
    const skip = (page - 1) * limit;

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('userId', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    return { expenses, total };
  }

  static async deleteExpense(id: string): Promise<void> {
    const expense = await Expense.findById(id);
    if (!expense) {
      throw new AppError(404, 'NOT_FOUND', 'Expense not found');
    }
    await Expense.findByIdAndDelete(id);
  }

  static async getFinanceSummary(filters: {
    from?: string;
    to?: string;
  }): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    incomeByMethod: { cash: number; card: number; mobile: number };
    expensesByCategory: Record<string, number>;
    dailyIncome: Array<{ date: string; amount: number }>;
    dailyExpenses: Array<{ date: string; amount: number }>;
    recentExpenses: IExpense[];
    recentPayments: any[];
  }> {
    const dateQuery: Record<string, unknown> = {};
    if (filters.from || filters.to) {
      dateQuery.createdAt = {};
      if (filters.from) {
        (dateQuery.createdAt as Record<string, unknown>).$gte = new Date(filters.from);
      }
      if (filters.to) {
        (dateQuery.createdAt as Record<string, unknown>).$lte = new Date(filters.to);
      }
    }

    const dateQueryExpense: Record<string, unknown> = {};
    if (filters.from || filters.to) {
      dateQueryExpense.date = {};
      if (filters.from) {
        (dateQueryExpense.date as Record<string, unknown>).$gte = new Date(filters.from);
      }
      if (filters.to) {
        (dateQueryExpense.date as Record<string, unknown>).$lte = new Date(filters.to);
      }
    }

    // Total Income (completed payments)
    const incomeResult = await Payment.aggregate([
      { $match: { status: 'completed', ...dateQuery } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalIncome = incomeResult[0]?.total || 0;

    // Income by method
    const incomeByMethodResult = await Payment.aggregate([
      { $match: { status: 'completed', ...dateQuery } },
      { $group: { _id: '$method', total: { $sum: '$amount' } } },
    ]);
    const incomeByMethod = { cash: 0, card: 0, mobile: 0 };
    incomeByMethodResult.forEach((item) => {
      if (item._id === 'cash') incomeByMethod.cash = item.total;
      else if (item._id === 'card') incomeByMethod.card = item.total;
      else if (item._id === 'mobile') incomeByMethod.mobile = item.total;
    });

    // Total Expenses
    const expenseResult = await Expense.aggregate([
      { $match: dateQueryExpense },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalExpenses = expenseResult[0]?.total || 0;

    // Expenses by category
    const expensesByCategoryResult = await Expense.aggregate([
      { $match: dateQueryExpense },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);
    const expensesByCategory: Record<string, number> = {};
    expensesByCategoryResult.forEach((item) => {
      expensesByCategory[item._id] = item.total;
    });

    // Daily Income (last 30 days)
    const dailyIncome = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', amount: 1, _id: 0 } },
    ]);

    // Daily Expenses (last 30 days)
    const dailyExpenses = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', amount: 1, _id: 0 } },
    ]);

    // Recent Expenses
    const recentExpenses = await Expense.find()
      .populate('userId', 'name')
      .sort({ date: -1 })
      .limit(10);

    // Recent Payments
    const recentPayments = await Payment.find({ status: 'completed' })
      .populate('orderId', 'orderNumber')
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      incomeByMethod,
      expensesByCategory,
      dailyIncome,
      dailyExpenses,
      recentExpenses,
      recentPayments,
    };
  }
}
