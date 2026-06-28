import { create } from 'zustand';
import { dashboardService, EmployeeDashboard, ManagerDashboard } from '../services/dashboard.service';

interface DashboardState {
  employeeKPIs: EmployeeDashboard | null;
  managerKPIs: ManagerDashboard | null;
  selectedPeriod: string;
  isLoading: boolean;
  error: string | null;

  fetchEmployeeKPIs: () => Promise<void>;
  fetchManagerKPIs: (period?: string) => Promise<void>;
  setPeriod: (period: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  employeeKPIs: null,
  managerKPIs: null,
  selectedPeriod: 'day',
  isLoading: false,
  error: null,

  fetchEmployeeKPIs: async () => {
    set({ isLoading: true, error: null });
    try {
      const kpis = await dashboardService.getEmployeeDashboard();
      set({ employeeKPIs: kpis, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch employee KPIs', isLoading: false });
    }
  },

  fetchManagerKPIs: async (period?: string) => {
    set({ isLoading: true, error: null });
    try {
      const kpis = await dashboardService.getManagerDashboard(period);
      set({ managerKPIs: kpis, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch manager KPIs', isLoading: false });
    }
  },

  setPeriod: (period: string) => set({ selectedPeriod: period }),
}));
