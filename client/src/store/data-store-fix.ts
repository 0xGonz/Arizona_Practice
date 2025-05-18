import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CSVType, UploadStatus } from '@/types';
import { processMonthlyCSV } from '@/lib/monthly-csv-parser';
import Papa from 'papaparse';

// Define the main data store interface
interface DataStore {
  // Upload Status
  uploadStatus: UploadStatus;
  setUploadStatus: (status: Partial<UploadStatus>) => void;
  
  // Raw Data Storage
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
  
  // Upload History
  uploadHistory: {
    id?: number;
    type: CSVType;
    date: Date;
    filename: string;
    month?: string;
  }[];
  
  // Server Data Sync
  setUploadsFromServer: (uploads: any[]) => void;
  loadCSVContent: (id: number) => Promise<any[] | undefined>;
}

// Helper function to save to local storage (simplified)
function saveToLocalStorage(data: any) {
  try {
    localStorage.setItem('financialData', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Create the store with persistence
export const useStore = create<DataStore>()(
  persist(
    (set, get) => ({
      // Upload Status
      uploadStatus: {
        annual: null,
        monthly: {}
      },
      
      // Set upload status
      setUploadStatus: (status) => set(state => ({
        ...state,
        uploadStatus: {
          ...state.uploadStatus,
          ...status
        }
      })),
      
      // Raw Data Storage
      annualData: null,
      monthlyData: {},
      
      // Upload History
      uploadHistory: [],
      
      // Process CSV data
      processCSVData: (type, data, month) => set(state => {
        if (type === 'annual') {
          // For annual data
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
                type: 'annual',
                date: new Date(),
                filename: 'annual.csv'
              }
            ]
          };
        } else if (type.startsWith('monthly-') && month) {
          // Standardize month name
          const cleanMonth = month.toLowerCase().trim();
          const isEType = type === 'monthly-e';
          
          // Process monthly data
          const processed = processMonthlyCSV(data, type);
          
          // Update or create month data
          const updatedMonthlyData = { ...state.monthlyData };
          if (!updatedMonthlyData[cleanMonth]) {
            updatedMonthlyData[cleanMonth] = {};
          }
          
          // Store the processed data by type
          updatedMonthlyData[cleanMonth] = {
            ...updatedMonthlyData[cleanMonth],
            [isEType ? 'e' : 'o']: processed
          };
          
          // Update monthly status
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
                type: type as CSVType,
                date: new Date(),
                filename: `${cleanMonth}-${isEType ? 'E' : 'O'}.csv`,
                month: cleanMonth
              }
            ]
          };
        }
        
        return state;
      }),
      
      // Clear uploaded data
      clearUploadedData: (type, month) => {
        if (type === 'all') {
          // Send request to server to delete all data
          fetch('/api/finance/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deleteAll: true,
              confirmDeleteAll: "CONFIRM_DELETE_ALL"
            })
          }).catch(err => console.error('Error deleting all data:', err));
          
          // Reset state
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
        
        if (type.startsWith('monthly-') && month) {
          // Delete specific month data
          const cleanMonth = month.toLowerCase().trim();
          
          // Send request to server to delete by month/type
          fetch('/api/finance/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              month: cleanMonth,
              fileType: type
            })
          }).catch(err => console.error(`Error deleting ${type} data for ${cleanMonth}:`, err));
          
          // Update the store state
          set(state => {
            // Create new copies to avoid mutation
            const newMonthlyData = { ...state.monthlyData };
            const newMonthlyStatus = { ...state.uploadStatus.monthly };
            
            // Update the data for the specific month and type
            if (newMonthlyData[cleanMonth]) {
              if (type === 'monthly-e') {
                newMonthlyData[cleanMonth] = {
                  ...newMonthlyData[cleanMonth],
                  e: null
                };
              } else {
                newMonthlyData[cleanMonth] = {
                  ...newMonthlyData[cleanMonth],
                  o: null
                };
              }
              
              // If both types are null, remove the month entirely
              if (newMonthlyData[cleanMonth].e === null && newMonthlyData[cleanMonth].o === null) {
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
              
              // If both are false, remove the status
              if (newMonthlyStatus[cleanMonth].e === false && newMonthlyStatus[cleanMonth].o === false) {
                delete newMonthlyStatus[cleanMonth];
              }
            }
            
            // Filter upload history
            const newHistory = state.uploadHistory.filter(
              upload => !(upload.type === type && upload.month?.toLowerCase() === cleanMonth)
            );
            
            return {
              ...state,
              monthlyData: newMonthlyData,
              uploadHistory: newHistory,
              uploadStatus: {
                ...state.uploadStatus,
                monthly: newMonthlyStatus
              }
            };
          });
          return;
        }
        
        // For annual data
        if (type === 'annual') {
          // Send delete request for annual data
          fetch('/api/finance/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileType: 'annual'
            })
          }).catch(err => console.error('Error deleting annual data:', err));
          
          // Update the store
          set(state => ({
            ...state,
            annualData: null,
            uploadHistory: state.uploadHistory.filter(upload => upload.type !== 'annual'),
            uploadStatus: {
              ...state.uploadStatus,
              annual: null
            }
          }));
        }
      },
      
      // Set uploads from server data
      setUploadsFromServer: (uploads) => set(state => ({
        ...state,
        uploadHistory: uploads
      })),
      
      // Load CSV content from server
      loadCSVContent: async (id) => {
        try {
          const response = await fetch(`/api/uploads/${id}`);
          if (!response.ok) {
            throw new Error('Failed to load CSV content');
          }
          
          const data = await response.json();
          if (data && data.content) {
            // Parse CSV
            const parsed = Papa.parse(data.content, {
              header: true,
              skipEmptyLines: true
            });
            
            if (parsed.data && Array.isArray(parsed.data)) {
              console.log(`Successfully loaded CSV content for upload ID ${id}, found ${parsed.data.length} rows`);
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