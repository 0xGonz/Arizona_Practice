import { create } from 'zustand';
import { DateRange } from 'react-day-picker';

interface AnalysisFilters {
  range: DateRange;
  selectedEmployee: string;
  selectedBusiness: string;
}

interface AnalysisStore {
  filters: AnalysisFilters;
  setDateRange: (range: DateRange) => void;
  selectEntity: (id: string) => void;
  clearFilters: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  filters: {
    range: {
      from: undefined,
      to: undefined
    },
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
  selectEntity: (id: string) => set((state) => {
    // Determine which type of entity was selected based on current route/context
    const isEmployee = window.location.pathname.includes('employee');

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
      range: {
        from: undefined,
        to: undefined
      },
      selectedEmployee: '',
      selectedBusiness: '',
    }
  }),
}));