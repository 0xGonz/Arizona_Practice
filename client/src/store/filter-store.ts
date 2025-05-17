import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  // For recursive line item table
  showOnlyNegative: boolean;
  showSimplified: boolean;
  searchTerm: string;
  
  // Actions
  setShowOnlyNegative: (value: boolean) => void;
  setShowSimplified: (value: boolean) => void;
  setSearchTerm: (value: string) => void;
  resetFilters: () => void;
}

// Create a store with persistence
export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      // Initial state
      showOnlyNegative: false,
      showSimplified: false,
      searchTerm: '',
      
      // Actions
      setShowOnlyNegative: (value) => set({ showOnlyNegative: value }),
      setShowSimplified: (value) => set({ showSimplified: value }),
      setSearchTerm: (value) => set({ searchTerm: value }),
      resetFilters: () => set({ 
        showOnlyNegative: false, 
        showSimplified: false, 
        searchTerm: '' 
      }),
    }),
    {
      name: 'financial-table-filters', // localStorage key
    }
  )
);