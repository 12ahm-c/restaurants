import { apiClient } from './api-client';
import { ApiResponse } from '../types';

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeByMethod: { cash: number; card: number; mobile: number };
  expensesByCategory: Record<string, number>;
  dailyIncome: Array<{ date: string; amount: number }>;
  dailyExpenses: Array<{ date: string; amount: number }>;
  recentExpenses: Expense[];
  recentPayments: any[];
}

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  vendor?: string;
  paymentMethod: string;
  notes?: string;
  userId: { _id: string; name: string };
  date: string;
  isRecurring: boolean;
  createdAt: string;
}

export const financeService = {
  async getSummary(filters?: { from?: string; to?: string }): Promise<FinanceSummary> {
    const params = new URLSearchParams();
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);

    const response = await apiClient.get<ApiResponse<FinanceSummary>>(`/finance/summary?${params.toString()}`);
    return response.data.data!;
  },

  async getExpenses(filters?: {
    category?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ expenses: Expense[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<ApiResponse<Expense[]>>(`/finance/expenses?${params.toString()}`);
    return {
      expenses: response.data.data || [],
      total: response.data.meta?.total || 0,
    };
  },

  async createExpense(data: {
    description: string;
    amount: number;
    category: string;
    vendor?: string;
    paymentMethod?: string;
    notes?: string;
    date?: string;
  }): Promise<Expense> {
    const response = await apiClient.post<ApiResponse<Expense>>('/finance/expenses', data);
    return response.data.data!;
  },

  async deleteExpense(id: string): Promise<void> {
    await apiClient.delete(`/finance/expenses/${id}`);
  },
};
