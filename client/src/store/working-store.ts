import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { processMonthlyCSV } from '@/lib/monthly-csv-parser';
import Papa from 'papaparse';

// Define types
export type CSVType = 'annual' | 'monthly-e' | 'monthly-o';

type UploadStatus = {
  annual: { status: string; message: string } | null;
  monthly: {
    [month: string]: {
      e: boolean;
      o: boolean;
    }
  }
};

// Basic store interface
interface DataStore {
  // Upload Status
  uploadStatus: UploadStatus;
  setUploadStatus: (status: Partial<UploadStatus>) => void;
  
  // Data Storage
  annualData: any[] | null;
  monthlyData: {
    [month: string]: {
      e?: any | null;
      o?: any | null;
    };
  };
  
  // Data Processing
  processCSVData: (type: CSVType, data: any[], month?: string) => void;
  
  // Data Management
  clearUploadedData: (type: CSVType | 'all', month?: string) => void;
  
  // History
  uploadHistory: Array<{
    id?: number;
    type: CSVType;
    date: Date;
    filename: string;
    month?: string;
  }>;
  
  // Server Sync
  setUploadsFromServer: (uploads: any[]) => void;
  loadCSVContent: (id: number) => Promise<any[] | undefined>;
}

// Create the store
export const useStore = create<DataStore>()(
  persist(
    (set) => ({
      // Initial state
      uploadStatus: {
        annual: null,
        monthly: {}
      },
      annualData: null,
      monthlyData: {},
      uploadHistory: [],
      
      // Set upload status
      setUploadStatus: (status) => set(state => ({
        ...state,
        uploadStatus: {
          ...state.uploadStatus,
          ...status
        }
      })),
      
      // Process CSV data
      processCSVData: (type, data, month) => set(state => {
        try {
          // Handle annual data
          if (type === 'annual') {
            return {
              ...state,
              annualData: data,
              uploadStatus: {
                ...state.uploadStatus,
                annual: {
                  status: 'complete',
                  message: 'Annual data uploaded successfully'
                }
              },
              uploadHistory: [
                ...state.uploadHistory,
                {
                  type: type,
                  date: new Date(),
                  filename: 'annual.csv'
                }
              ]
            };
          }
          
          // Handle monthly data
          if (type.startsWith('monthly-') && month) {
            const cleanMonth = month.toLowerCase().trim();
            const isEType = type === 'monthly-e';
            
            // Process data
            const processed = processMonthlyCSV(data, type);
            
            // Update monthly data
            const updatedMonthlyData = { ...state.monthlyData };
            if (!updatedMonthlyData[cleanMonth]) {
              updatedMonthlyData[cleanMonth] = {};
            }
            
            updatedMonthlyData[cleanMonth] = {
              ...updatedMonthlyData[cleanMonth],
              [isEType ? 'e' : 'o']: processed
            };
            
            // Update status
            const updatedMonthlyStatus = { ...state.uploadStatus.monthly };
            if (!updatedMonthlyStatus[cleanMonth]) {
              updatedMonthlyStatus[cleanMonth] = { e: false, o: false };
            }
            
            updatedMonthlyStatus[cleanMonth] = {
              ...updatedMonthlyStatus[cleanMonth],
              [isEType ? 'e' : 'o']: true
            };
            
            return {
              ...state,
              monthlyData: updatedMonthlyData,
              uploadStatus: {
                ...state.uploadStatus,
                monthly: updatedMonthlyStatus
              },
              uploadHistory: [
                ...state.uploadHistory,
                {
                  type: type,
                  date: new Date(),
                  filename: `${cleanMonth}-${isEType ? 'E' : 'O'}.csv`,
                  month: cleanMonth
                }
              ]
            };
          }
        } catch (error) {
          console.error('Error processing data:', error);
        }
        
        return state;
      }),
      
      // Clear uploaded data
      clearUploadedData: (type, month) => {
        // Delete all data
        if (type === 'all') {
          // Send request to delete all data
          fetch('/api/finance/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deleteAll: true,
              confirmDeleteAll: "CONFIRM_DELETE_ALL"
            })
          }).catch(error => console.error('Error deleting all data:', error));
          
          // Reset state immediately
          set({
            annualData: null,
            monthlyData: {},
            uploadHistory: [],
            uploadStatus: {
              annual: null,
              monthly: {}
            }
          });
          return;
        }
        
        // Delete monthly data
        if (type.startsWith('monthly-') && month) {
          const cleanMonth = month.toLowerCase().trim();
          
          // Send request to delete by month/type
          fetch('/api/finance/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              month: cleanMonth,
              fileType: type
            })
          }).catch(error => console.error(`Error deleting ${type} data for ${cleanMonth}:`, error));
          
          // Update state
          set(state => {
            // Create copies of data
            const newMonthlyData = { ...state.monthlyData };
            const newMonthlyStatus = { ...state.uploadStatus.monthly };
            
            // Update monthly data
            if (newMonthlyData[cleanMonth]) {
              if (type === 'monthly-e') {
                newMonthlyData[cleanMonth].e = null;
              } else {
                newMonthlyData[cleanMonth].o = null;
              }
              
              // Remove month if both types are gone
              if (!newMonthlyData[cleanMonth].e && !newMonthlyData[cleanMonth].o) {
                delete newMonthlyData[cleanMonth];
              }
            }
            
            // Update status
            if (newMonthlyStatus[cleanMonth]) {
              if (type === 'monthly-e') {
                newMonthlyStatus[cleanMonth].e = false;
              } else {
                newMonthlyStatus[cleanMonth].o = false;
              }
              
              // Remove month if both types are false
              if (!newMonthlyStatus[cleanMonth].e && !newMonthlyStatus[cleanMonth].o) {
                delete newMonthlyStatus[cleanMonth];
              }
            }
            
            // Filter history
            const newHistory = state.uploadHistory.filter(
              upload => !(upload.type === type && upload.month?.toLowerCase() === cleanMonth)
            );
            
            return {
              ...state,
              monthlyData: newMonthlyData,
              uploadStatus: {
                ...state.uploadStatus,
                monthly: newMonthlyStatus
              },
              uploadHistory: newHistory
            };
          });
          return;
        }
        
        // Delete annual data
        if (type === 'annual') {
          // Send request to delete annual data
          fetch('/api/finance/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileType: 'annual'
            })
          }).catch(error => console.error('Error deleting annual data:', error));
          
          // Update state
          set(state => ({
            ...state,
            annualData: null,
            uploadStatus: {
              ...state.uploadStatus,
              annual: null
            },
            uploadHistory: state.uploadHistory.filter(upload => upload.type !== 'annual')
          }));
        }
      },
      
      // Set uploads from server
      setUploadsFromServer: (uploads) => set(state => ({
        ...state,
        uploadHistory: uploads
      })),
      
      // Load CSV content
      loadCSVContent: async (id) => {
        try {
          const response = await fetch(`/api/uploads/${id}`);
          if (!response.ok) {
            throw new Error('Failed to load CSV content');
          }
          
          const data = await response.json();
          if (data && data.content) {
            const parsed = Papa.parse(data.content, {
              header: true,
              skipEmptyLines: true
            });
            
            if (parsed.data && Array.isArray(parsed.data)) {
              console.log(`Successfully loaded CSV content for upload ID ${id}`);
              return parsed.data;
            }
          }
          
          return undefined;
        } catch (error) {
          console.error(`Error loading CSV content for ID ${id}:`, error);
          return undefined;
        }
      }
    }),
    {
      name: 'financial-data-storage',
      partialize: (state) => ({
        annualData: state.annualData,
        monthlyData: state.monthlyData,
        uploadStatus: state.uploadStatus,
        uploadHistory: state.uploadHistory
      })
    }
  )
);