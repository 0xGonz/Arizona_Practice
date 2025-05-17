import { create } from 'zustand';
import { format, subMonths, endOfMonth, startOfMonth } from 'date-fns';

interface AnalysisState {
  // Filter states
  periodType: 'FULL_YEAR' | 'MONTH';
  monthSelected: string | null;  // ISO format '2024-01' for Jan 2024
  employeeId: string | null;
  businessId: string | null;
  range: { from: string; to: string };  // ISO date strings
  
  // Actions
  setPeriodFullYear: () => void;
  setPeriodMonth: (month: string) => void;
  selectEmployee: (id: string | null) => void;
  selectBusiness: (id: string | null) => void;
  resetFilters: () => void;
}

// Default range is last 12 months
const defaultRange = {
  from: format(subMonths(new Date(), 11), 'yyyy-MM-dd'),
  to: format(new Date(), 'yyyy-MM-dd'),
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  // Initial state
  periodType: 'FULL_YEAR',
  monthSelected: null,
  employeeId: null,
  businessId: null,
  range: defaultRange,
  
  // Actions
  setPeriodFullYear: () => set({ 
    periodType: 'FULL_YEAR', 
    monthSelected: null,
    range: defaultRange 
  }),
  
  setPeriodMonth: (month) => {
    // month format: '2024-01'
    const dateObj = new Date(`${month}-01`); // Convert to date (e.g., 2024-01-01)
    const from = format(startOfMonth(dateObj), 'yyyy-MM-dd');
    const to = format(endOfMonth(dateObj), 'yyyy-MM-dd');
    
    set({ 
      periodType: 'MONTH', 
      monthSelected: month, 
      range: { from, to } 
    });
  },
  
  selectEmployee: (id) => set({ employeeId: id }),
  
  selectBusiness: (id) => set({ businessId: id }),
  
  resetFilters: () => set({
    periodType: 'FULL_YEAR',
    monthSelected: null,
    employeeId: null,
    businessId: null,
    range: defaultRange
  })
}));