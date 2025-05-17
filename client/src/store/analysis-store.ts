import { create } from 'zustand';
import { DateRange } from 'react-day-picker';
import { getCurrentYearDateRange } from '@/lib/data-utils';

interface AnalysisFilters {
  range: DateRange;
  selectedEmployee: string;
  selectedBusiness: string;
}

interface AnalysisStore {
  filters: AnalysisFilters;
  setDateRange: (range: DateRange) => void;
  selectEntity: (id: string, entityType?: 'employee' | 'business') => void;
  clearFilters: () => void;
}

// Initialize with current year date range by default
const currentYearRange = getCurrentYearDateRange();

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  filters: {
    range: currentYearRange,
    selectedEmployee: '',
    selectedBusiness: '',
  },
  
  // Set the date range
  setDateRange: (range: DateRange) => set((state) => ({
    filters: {
      ...state.filters,
      range
    }
  })),
  
  // Select an entity (either employee or business)
  selectEntity: (id: string, entityType?: 'employee' | 'business') => set((state) => {
    // Determine which type of entity was selected based on passed type or current route
    const isEmployee = entityType 
      ? entityType === 'employee'
      : window.location.pathname.includes('employee');

    return {
      filters: {
        ...state.filters,
        selectedEmployee: isEmployee ? id : state.filters.selectedEmployee,
        selectedBusiness: !isEmployee ? id : state.filters.selectedBusiness,
      }
    };
  }),
  
  // Clear all filters
  clearFilters: () => set({
    filters: {
      range: currentYearRange, // Reset to current year instead of undefined
      selectedEmployee: '',
      selectedBusiness: '',
    }
  }),
}));