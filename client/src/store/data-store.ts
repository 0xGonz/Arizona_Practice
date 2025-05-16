import { create } from 'zustand';
import { CSVType, UploadStatus, MarginTrendPoint, RevenueMixItem, PerformerData, ComparisonData } from '@/types';
import { processAnnualCSV, processMonthlyCSV } from '@/lib/csv-parser';

interface DataStore {
  // Upload Status
  uploadStatus: UploadStatus;
  setUploadStatus: (status: Partial<UploadStatus>) => void;
  
  // Raw Data Storage
  annualData: any[] | null;
  monthlyData: {
    [month: string]: {
      e?: any[] | null;
      o?: any[] | null;
    };
  };
  
  // Data Processing
  processCSVData: (type: CSVType, data: any[], month?: string) => void;
  
  // Processed Data
  revenueMix: RevenueMixItem[];
  marginTrend: MarginTrendPoint[];
  topPerformers: PerformerData[];
  bottomPerformers: PerformerData[];
  ancillaryComparison: ComparisonData[];
  
  // Upload History
  uploadHistory: {
    type: CSVType;
    date: Date;
    filename: string;
    month?: string;
  }[];
}

export const useStore = create<DataStore>((set) => ({
  // Initial Upload Status
  uploadStatus: {
    annual: false,
    monthly: {
      january: { e: false, o: false },
      february: { e: false, o: false },
      march: { e: false, o: false },
      april: { e: false, o: false },
      may: { e: false, o: false },
      june: { e: false, o: false },
      july: { e: false, o: false },
      august: { e: false, o: false },
      september: { e: false, o: false },
      october: { e: false, o: false },
      november: { e: false, o: false },
      december: { e: false, o: false }
    }
  },
  
  setUploadStatus: (status) => set((state) => {
    // Handle annual status update
    let newStatus = { ...state.uploadStatus };
    
    if (status.annual !== undefined) {
      newStatus.annual = status.annual;
    }
    
    // Handle monthly status updates
    if (status.monthly) {
      Object.entries(status.monthly).forEach(([month, monthStatus]) => {
        if (!newStatus.monthly[month]) {
          newStatus.monthly[month] = { e: false, o: false };
        }
        
        if (monthStatus.e !== undefined) {
          newStatus.monthly[month].e = monthStatus.e;
        }
        
        if (monthStatus.o !== undefined) {
          newStatus.monthly[month].o = monthStatus.o;
        }
      });
    }
    
    return { uploadStatus: newStatus };
  }),
  
  // Raw Data Storage
  annualData: null,
  monthlyData: {},
  
  // Process CSV Data
  processCSVData: (type, data, month) => set((state) => {
    if (type === 'annual') {
      const processedData = processAnnualCSV(data);
      return { annualData: processedData };
    } else if (type === 'monthly-e' && month) {
      const processedData = processMonthlyCSV(data, type);
      
      return {
        monthlyData: {
          ...state.monthlyData,
          [month]: {
            ...state.monthlyData[month],
            e: processedData
          }
        }
      };
    } else if (type === 'monthly-o' && month) {
      const processedData = processMonthlyCSV(data, type);
      
      return {
        monthlyData: {
          ...state.monthlyData,
          [month]: {
            ...state.monthlyData[month],
            o: processedData
          }
        }
      };
    }
    
    return state;
  }),
  
  // Processed Data (derived from uploaded data)
  revenueMix: [],
  marginTrend: [],
  topPerformers: [],
  bottomPerformers: [],
  ancillaryComparison: [],
  
  uploadHistory: []
}));
