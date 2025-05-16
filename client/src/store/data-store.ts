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
  
  // Processed Data (would normally be derived from raw data)
  revenueMix: [
    { name: 'Professional Fees', value: 2105380, color: '#42A5F5' },
    { name: 'Ancillary Income', value: 968210, color: '#66BB6A' },
    { name: 'Facility Fees', value: 245750, color: '#FFA726' },
    { name: 'Other Revenue', value: 133440, color: '#EF5350' }
  ],
  
  marginTrend: [
    { month: 'Jan', value: 18.2 },
    { month: 'Feb', value: 17.8 },
    { month: 'Mar', value: 19.5 },
    { month: 'Apr', value: 20.1 },
    { month: 'May', value: 22.4 },
    { month: 'Jun', value: 21.9 },
    { month: 'Jul', value: 23.2 },
    { month: 'Aug', value: 22.8 },
    { month: 'Sep', value: 21.5 },
    { month: 'Oct', value: 20.9 },
    { month: 'Nov', value: 19.8 },
    { month: 'Dec', value: 20.5 }
  ],
  
  topPerformers: [
    { id: '1', name: 'Dr. Jennifer Smith', value: 157640, percentage: 95, initials: 'JS' },
    { id: '2', name: 'Dr. Robert Johnson', value: 142835, percentage: 85, initials: 'RJ' },
    { id: '3', name: 'Dr. Maria Chen', value: 128950, percentage: 75, initials: 'MC' },
    { id: '4', name: 'Dr. David Williams', value: 117320, percentage: 68, initials: 'DW' },
    { id: '5', name: 'Dr. Alex Peterson', value: 102785, percentage: 60, initials: 'AP' }
  ],
  
  bottomPerformers: [
    { id: '1', name: 'Geriatric Practice', value: -42580, percentage: 85, initials: 'GP' },
    { id: '2', name: 'Physical Therapy', value: -31240, percentage: 70, initials: 'PT' },
    { id: '3', name: 'Dermatology Suite', value: -28950, percentage: 65, initials: 'DS' },
    { id: '4', name: 'Radiology Lab', value: -24720, percentage: 55, initials: 'RL' },
    { id: '5', name: 'Nephrology Practice', value: -18340, percentage: 40, initials: 'NP' }
  ],
  
  ancillaryComparison: [
    { category: 'Revenue', professional: 2484570, ancillary: 968210 },
    { category: 'Expenses', professional: 1925680, ancillary: 425180 },
    { category: 'Net Income', professional: 558890, ancillary: 543030 }
  ],
  
  uploadHistory: [
    {
      type: 'annual',
      date: new Date(),
      filename: '2024_consolidated.csv'
    },
    {
      type: 'monthly-e',
      month: 'january',
      date: new Date(),
      filename: '2024_jan_employees.csv'
    },
    {
      type: 'monthly-o',
      month: 'january',
      date: new Date(),
      filename: '2024_jan_other.csv'
    }
  ]
}));
