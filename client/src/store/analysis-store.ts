import { create } from 'zustand';
import { format, subMonths } from 'date-fns';

// Type definitions for the analysis store
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface AnalysisFilters {
  range: DateRange;
  selectedEmployee: string | null;
  selectedBusiness: string | null;
}

interface AnalysisStore {
  // Filters
  filters: AnalysisFilters;
  
  // Actions
  setDateRange: (range: DateRange) => void;
  setSelectedEmployee: (employeeId: string | null) => void;
  setSelectedBusiness: (businessId: string | null) => void;
  resetFilters: () => void;
}

// Set default range to last 12 months
const getDefaultRange = (): DateRange => {
  const now = new Date();
  return {
    from: subMonths(now, 12),
    to: now
  };
};

// Create the store
export const useAnalysisStore = create<AnalysisStore>((set) => ({
  // Initial state
  filters: {
    range: getDefaultRange(),
    selectedEmployee: null,
    selectedBusiness: null
  },
  
  // Actions
  setDateRange: (range) => set(state => ({
    filters: {
      ...state.filters,
      range
    }
  })),
  
  setSelectedEmployee: (employeeId) => set(state => ({
    filters: {
      ...state.filters,
      selectedEmployee: employeeId
    }
  })),
  
  setSelectedBusiness: (businessId) => set(state => ({
    filters: {
      ...state.filters,
      selectedBusiness: businessId
    }
  })),
  
  resetFilters: () => set({
    filters: {
      range: getDefaultRange(),
      selectedEmployee: null,
      selectedBusiness: null
    }
  })
}));