import { create } from 'zustand';

interface AnalysisFilters {
  selectedMonth: string;
  selectedEmployee: string;
  selectedBusiness: string;
}

interface AnalysisStore {
  filters: AnalysisFilters;
  setSelectedMonth: (month: string) => void;
  selectEntity: (id: string, entityType?: 'employee' | 'business') => void;
  clearFilters: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  filters: {
    selectedMonth: '',  // Empty means all months (or most recent available)
    selectedEmployee: '',
    selectedBusiness: '',
  },
  
  // Set the selected month
  setSelectedMonth: (month: string) => set((state) => ({
    filters: {
      ...state.filters,
      selectedMonth: month
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
      selectedMonth: '',  // Reset to all months
      selectedEmployee: '',
      selectedBusiness: '',
    }
  }),
}));