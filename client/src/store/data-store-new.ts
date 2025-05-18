import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Define the CSV types
type CSVType = 'annual' | 'monthly-e' | 'monthly-o';
import { processMonthlyCSV } from '@/lib/monthly-csv-parser';
import Papa from 'papaparse';

// Define types for the store
type UploadStatus = {
  annual: { status: string; message: string } | null;
  monthly: {
    [month: string]: {
      e: boolean;
      o: boolean;
    }
  }
};

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
          // Clean the month name
          const cleanMonth = month.toLowerCase().trim();
          const isEType = type === 'monthly-e';
          
          try {
            // Process the data
            const processed = processMonthlyCSV(data, type);
            
            // Update the monthly data
            const updatedMonthlyData = { ...state.monthlyData };
            if (!updatedMonthlyData[cleanMonth]) {
              updatedMonthlyData[cleanMonth] = {};
            }
            
            // Store by type (e or o)
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
                  type: type,
                  date: new Date(),
                  filename: `${cleanMonth}-${isEType ? 'E' : 'O'}.csv`,
                  month: cleanMonth
                }
              ]
            };
          } catch (error) {
            console.error(`Error processing ${type} data:`, error);
            return state;
          }
        }
        
        // If no valid type/month, return state unchanged
        return state;
      }),
      
      // Clear uploaded data by type
      clearUploadedData: (type, month) => {
        if (type === 'all') {
          // Delete all data from server
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
          const cleanMonth = month.toLowerCase().trim();
          
          // Delete from server
          fetch('/api/finance/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              month: cleanMonth,
              fileType: type
            })
          }).catch(err => console.error(`Error deleting ${type} data for ${cleanMonth}:`, err));
          
          // Update state
          set(state => {
            // Make copies of data structures we'll modify
            const newMonthlyData = { ...state.monthlyData };
            const newMonthlyStatus = { ...state.uploadStatus.monthly };
            
            // Update monthly data for the specific type
            if (newMonthlyData[cleanMonth]) {
              const isEType = type === 'monthly-e';
              if (isEType) {
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
              
              // If both types are gone, remove the month
              if (!newMonthlyData[cleanMonth].e && !newMonthlyData[cleanMonth].o) {
                delete newMonthlyData[cleanMonth];
              }
            }
            
            // Update upload status
            if (newMonthlyStatus[cleanMonth]) {
              const isEType = type === 'monthly-e';
              if (isEType) {
                newMonthlyStatus[cleanMonth].e = false;
              } else {
                newMonthlyStatus[cleanMonth].o = false;
              }
              
              // If both are false, remove the month
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
        
        if (type === 'annual') {
          // Delete annual data from server
          fetch('/api/finance/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileType: 'annual'
            })
          }).catch(err => console.error('Error deleting annual data:', err));
          
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
            // Parse the CSV content
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