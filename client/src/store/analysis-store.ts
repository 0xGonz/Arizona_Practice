import { create } from 'zustand';

// Default date range - rolling 12 months
const getCurrentMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
};

const getPreviousYearMonth = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  date.setDate(1);
  return date.toISOString().split('T')[0];
};

const defaultRange = {
  from: getPreviousYearMonth(),
  to: getCurrentMonth()
};

interface AnalysisState {
  // Filter state
  range: { from: string; to: string };
  period: 'full-year' | 'monthly';
  selectedMonth: string | null;
  employeeId: string | null;
  businessId: string | null;
  
  // Actions
  setRange: (range: { from: string; to: string }) => void;
  setPeriod: (period: 'full-year' | 'monthly') => void;
  setSelectedMonth: (month: string | null) => void;
  selectEmployee: (id: string | null) => void;
  selectBusiness: (id: string | null) => void;
  resetFilters: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  // Initial state
  range: defaultRange,
  period: 'full-year',
  selectedMonth: null,
  employeeId: null,
  businessId: null,
  
  // Actions
  setRange: (range) => set({ range }),
  setPeriod: (period) => set({ period }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  selectEmployee: (id) => set({ employeeId: id, businessId: null }),
  selectBusiness: (id) => set({ businessId: id, employeeId: null }),
  resetFilters: () => set({
    range: defaultRange,
    period: 'full-year',
    selectedMonth: null,
    employeeId: null,
    businessId: null
  })
}));

export default useAnalysisStore;