import { create } from 'zustand';
import { format } from 'date-fns';

interface AnalysisState {
  // Filter states
  period: 'full-year' | 'monthly';
  selectedMonth: string | null;
  employeeId: string | null;
  businessId: string | null;
  
  // Actions
  setPeriod: (period: 'full-year' | 'monthly') => void;
  setSelectedMonth: (month: string | null) => void;
  selectEmployee: (id: string | null) => void;
  selectBusiness: (id: string | null) => void;
  resetFilters: () => void;
  
  // Derived data
  getDateRange: () => { from: string; to: string };
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  // Initial state
  period: 'full-year',
  selectedMonth: null,
  employeeId: null,
  businessId: null,
  
  // Actions
  setPeriod: (period) => set({ period }),
  
  setSelectedMonth: (month) => set({ 
    selectedMonth: month,
    // Auto-switch to monthly view when month is selected
    period: month ? 'monthly' : get().period
  }),
  
  selectEmployee: (id) => set({ employeeId: id }),
  
  selectBusiness: (id) => set({ businessId: id }),
  
  resetFilters: () => set({
    period: 'full-year',
    selectedMonth: null,
    employeeId: null,
    businessId: null
  }),
  
  // Calculate date range based on current filters
  getDateRange: () => {
    const { period, selectedMonth } = get();
    const currentYear = new Date().getFullYear();
    
    if (period === 'monthly' && selectedMonth) {
      // Create date range for the selected month
      const date = new Date(selectedMonth);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      // First day of month
      const startDate = new Date(year, month, 1);
      
      // Last day of month (first day of next month minus one day)
      const endDate = new Date(year, month + 1, 0);
      
      return {
        from: format(startDate, 'yyyy-MM-dd'),
        to: format(endDate, 'yyyy-MM-dd')
      };
    } else {
      // Full year range (Jan 1 to Dec 31 of current year)
      return {
        from: `${currentYear}-01-01`,
        to: `${currentYear}-12-31`
      };
    }
  }
}));