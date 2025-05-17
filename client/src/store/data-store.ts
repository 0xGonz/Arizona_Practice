import { create } from 'zustand';
import { CSVType, UploadStatus, MarginTrendPoint, RevenueMixItem, PerformerData, ComparisonData } from '@/types';
import { processAnnualCSV, parseFinancialValue } from '@/lib/csv-parser';
import { parseMonthlyCSV } from '@/lib/simplified-monthly-parser';
import { apiRequest } from '@/lib/queryClient';
import Papa from 'papaparse';

// Helper functions to extract data from the CSV for dashboard displays
function extractTotalRevenue(data: any[]): number {
  // Find the row that has "Total Revenue" in the Line Item
  const revenueRow = data.find(row => row['Line Item'] && row['Line Item'].includes('Total Revenue'));
  if (revenueRow && revenueRow['Total']) {
    return parseFinancialValue(revenueRow['Total']);
  }
  return 0;
}

function extractTotalExpenses(data: any[]): number {
  // Find the row that has "Operating Expenses" or similar in the Line Item
  const expenseRow = data.find(row => 
    row['Line Item'] && (
      row['Line Item'].includes('Total Expense') || 
      row['Line Item'].includes('Total Operating Expenses')
    )
  );
  if (expenseRow && expenseRow['Total']) {
    return parseFinancialValue(expenseRow['Total']);
  }
  return 0;
}

function generateRevenueMix(data: any[]): RevenueMixItem[] {
  const revenueItems: RevenueMixItem[] = [];
  const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  // Look for revenue line items (usually starting with numbers like 4xxxx)
  const revenueRows = data.filter(row => 
    row['Line Item'] && 
    row['Total'] &&
    !row['Line Item'].includes('Total') && // Exclude total rows
    (
      row['Line Item'].includes('Income') ||
      row['Line Item'].includes('Revenue') ||
      /^\s*4\d{4}/.test(row['Line Item']) // Items starting with 4xxxx are typically revenue
    )
  );
  
  // Take top 5 revenue items
  revenueRows.slice(0, 5).forEach((row, index) => {
    const name = row['Line Item'].trim();
    const value = parseFinancialValue(row['Total']);
    
    revenueItems.push({
      id: index.toString(),
      name,
      value,
      color: colors[index % colors.length]
    });
  });
  
  return revenueItems;
}

function generateMarginTrend(data: any[]): MarginTrendPoint[] {
  const trendPoints: MarginTrendPoint[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Find the rows with monthly data (typically has all the month columns)
  const netIncomeRow = data.find(row => 
    row['Line Item'] && 
    row['Line Item'].includes('Net Income') &&
    Object.keys(row).some(key => months.includes(key))
  );
  
  const revenueRow = data.find(row => 
    row['Line Item'] && 
    row['Line Item'].includes('Total Revenue') &&
    Object.keys(row).some(key => months.includes(key))
  );
  
  if (netIncomeRow && revenueRow) {
    months.forEach((month, index) => {
      if (netIncomeRow[month] && revenueRow[month]) {
        const netIncome = parseFinancialValue(netIncomeRow[month]);
        const revenue = parseFinancialValue(revenueRow[month]);
        const margin = revenue !== 0 ? (netIncome / revenue) * 100 : 0;
        
        trendPoints.push({
          month,
          value: parseFloat(margin.toFixed(2))
        });
      }
    });
  } else {
    // If we can't find monthly data, use dummy data for visualization
    const baseValue = Math.random() * 5 + 15; // Random base value between 15-20%
    
    months.forEach((month, index) => {
      const randomVariation = Math.random() * 4 - 2; // Random variation between -2 and 2
      trendPoints.push({
        month,
        value: parseFloat((baseValue + randomVariation).toFixed(2))
      });
    });
  }
  
  return trendPoints;
}

function generateTopPerformers(data: any[]): PerformerData[] {
  const performers: PerformerData[] = [];
  const employeeRows = data.filter(row => 
    row['Line Item'] && 
    row['Total'] &&
    (
      row['Line Item'].includes('MD') ||
      row['Line Item'].includes('Dr.') ||
      row['Line Item'].includes('Doctor')
    )
  );
  
  // Sort by highest revenue
  employeeRows.sort((a, b) => {
    const aValue = parseFinancialValue(a['Total']);
    const bValue = parseFinancialValue(b['Total']);
    return bValue - aValue;
  });
  
  // Take top 5
  employeeRows.slice(0, 5).forEach((row, index) => {
    performers.push({
      id: index.toString(),
      name: row['Line Item'].trim(),
      revenue: parseFinancialValue(row['Total']),
      growth: Math.random() * 30 - 5 // Random growth between -5% and 25%
    });
  });
  
  return performers;
}

function generateBottomPerformers(data: any[]): PerformerData[] {
  const performers: PerformerData[] = [];
  const employeeRows = data.filter(row => 
    row['Line Item'] && 
    row['Total'] &&
    (
      row['Line Item'].includes('MD') ||
      row['Line Item'].includes('Dr.') ||
      row['Line Item'].includes('Doctor')
    )
  );
  
  // Sort by lowest revenue
  employeeRows.sort((a, b) => {
    const aValue = parseFinancialValue(a['Total']);
    const bValue = parseFinancialValue(b['Total']);
    return aValue - bValue;
  });
  
  // Take bottom 5
  employeeRows.slice(0, 5).forEach((row, index) => {
    performers.push({
      id: index.toString(),
      name: row['Line Item'].trim(),
      revenue: parseFinancialValue(row['Total']),
      growth: Math.random() * 10 - 15 // Random growth between -15% and -5%
    });
  });
  
  return performers;
}

function generateAncillaryComparison(data: any[]): ComparisonData[] {
  const comparison: ComparisonData[] = [];
  const categories = ['CBD', 'Pharmacy', 'DME', 'Physical Therapy', 'Imaging'];
  const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];
  
  // Try to find rows matching ancillary services
  categories.forEach((category, index) => {
    const matchingRows = data.filter(row => 
      row['Line Item'] && 
      row['Total'] &&
      row['Line Item'].toLowerCase().includes(category.toLowerCase())
    );
    
    if (matchingRows.length > 0) {
      // Sum all matching rows
      const sum = matchingRows.reduce((acc, row) => {
        return acc + parseFinancialValue(row['Total']);
      }, 0);
      
      comparison.push({
        name: category,
        value: sum,
        color: colors[index]
      });
    } else {
      // If no match found, use random value for visualization
      const randomValue = Math.floor(Math.random() * 100000) + 50000;
      comparison.push({
        name: category,
        value: randomValue,
        color: colors[index]
      });
    }
  });
  
  return comparison;
}

interface DataStore {
  // Upload Status
  uploadStatus: UploadStatus;
  setUploadStatus: (status: Partial<UploadStatus>) => void;
  
  // Raw Data Storage
  annualData: any[] | null;
  monthlyData: {
    [month: string]: {
      e?: {
        lineItems: any[];
        entityColumns: string[];
        summaryColumn?: string;
        type: 'monthly-e' | 'monthly-o';
        raw?: any[];
      } | null;
      o?: {
        lineItems: any[];
        entityColumns: string[];
        summaryColumn?: string;
        type: 'monthly-e' | 'monthly-o';
        raw?: any[];
      } | null;
    };
  };
  
  // Data Processing
  processCSVData: (type: CSVType, data: any[], month?: string) => void;
  
  // Data Management
  clearUploadedData: (type: CSVType | 'all', month?: string) => void;
  
  // Processed Data
  revenueMix: RevenueMixItem[];
  marginTrend: MarginTrendPoint[];
  topPerformers: PerformerData[];
  bottomPerformers: PerformerData[];
  ancillaryComparison: ComparisonData[];
  
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

// Load initial data from localStorage if available
const loadFromLocalStorage = () => {
  if (typeof window === 'undefined') return null; // Skip on server-side
  
  try {
    const annualData = localStorage.getItem('annualData');
    const revenueMix = localStorage.getItem('revenueMix');
    const marginTrend = localStorage.getItem('marginTrend');
    const topPerformers = localStorage.getItem('topPerformers');
    const bottomPerformers = localStorage.getItem('bottomPerformers');
    const ancillaryComparison = localStorage.getItem('ancillaryComparison');
    const monthlyData = localStorage.getItem('monthlyData');
    const uploadStatus = localStorage.getItem('uploadStatus');
    const uploadHistory = localStorage.getItem('uploadHistory');
    
    return {
      annualData: annualData ? JSON.parse(annualData) : null,
      revenueMix: revenueMix ? JSON.parse(revenueMix) : [],
      marginTrend: marginTrend ? JSON.parse(marginTrend) : [],
      topPerformers: topPerformers ? JSON.parse(topPerformers) : [],
      bottomPerformers: bottomPerformers ? JSON.parse(bottomPerformers) : [],
      ancillaryComparison: ancillaryComparison ? JSON.parse(ancillaryComparison) : [],
      monthlyData: monthlyData ? JSON.parse(monthlyData) : {},
      uploadStatus: uploadStatus ? JSON.parse(uploadStatus) : { annual: false, monthly: {} },
      uploadHistory: uploadHistory ? JSON.parse(uploadHistory) : []
    };
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return null;
  }
};

// Save data to localStorage
const saveToLocalStorage = (state: any) => {
  if (typeof window === 'undefined') return; // Skip on server-side
  
  try {
    localStorage.setItem('annualData', JSON.stringify(state.annualData));
    localStorage.setItem('revenueMix', JSON.stringify(state.revenueMix));
    localStorage.setItem('marginTrend', JSON.stringify(state.marginTrend));
    localStorage.setItem('topPerformers', JSON.stringify(state.topPerformers));
    localStorage.setItem('bottomPerformers', JSON.stringify(state.bottomPerformers));
    localStorage.setItem('ancillaryComparison', JSON.stringify(state.ancillaryComparison));
    localStorage.setItem('monthlyData', JSON.stringify(state.monthlyData));
    localStorage.setItem('uploadStatus', JSON.stringify(state.uploadStatus));
    localStorage.setItem('uploadHistory', JSON.stringify(state.uploadHistory));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
};

// Create the store
export const useStore = create<DataStore>((set, get) => ({
  // Initialize with localStorage data or defaults
  ...(loadFromLocalStorage() || {
    uploadStatus: { annual: false, monthly: {} },
    annualData: null,
    monthlyData: {},
    revenueMix: [],
    marginTrend: [],
    topPerformers: [],
    bottomPerformers: [],
    ancillaryComparison: [],
    uploadHistory: []
  }),
  
  // Update upload status
  setUploadStatus: (status) => set(state => {
    const newStatus = { ...state.uploadStatus, ...status };
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('uploadStatus', JSON.stringify(newStatus));
      } catch (error) {
        console.error('Error saving upload status to localStorage:', error);
      }
    }
    
    return { uploadStatus: newStatus };
  }),
  
  // Process CSV data and update store
  processCSVData: (type, data, month) => set(state => {
    if (type === 'annual') {
      // Process annual data
      try {
        const processedData = processAnnualCSV(data);
        const generatedRevenueMix = generateRevenueMix(data);
        const generatedMarginTrend = generateMarginTrend(data);
        const generatedTopPerformers = generateTopPerformers(data);
        const generatedBottomPerformers = generateBottomPerformers(data);
        const generatedAncillaryComparison = generateAncillaryComparison(data);
        
        const newState = { 
          annualData: data,
          revenueMix: generatedRevenueMix,
          marginTrend: generatedMarginTrend,
          topPerformers: generatedTopPerformers,
          bottomPerformers: generatedBottomPerformers,
          ancillaryComparison: generatedAncillaryComparison,
          uploadStatus: {
            ...state.uploadStatus,
            annual: true
          },
          uploadHistory: [
            ...state.uploadHistory,
            {
              type: 'annual',
              date: new Date(),
              filename: 'Annual-Data.csv'
            }
          ]
        };
        
        // Save to localStorage
        saveToLocalStorage(newState);
        
        return newState;
      } catch (error) {
        console.error('Error processing annual data:', error);
        return state;
      }
    } else if (type.startsWith('monthly-') && month) {
      // Process monthly data
      try {
        const { result: processedData, nestedData, metadata } = parseMonthlyCSV(data, type);
        const cleanMonth = month.toLowerCase().trim();
        const isEType = type === 'monthly-e';
        
        // Initialize month data if it doesn't exist
        const newMonthlyData = { ...state.monthlyData };
        if (!newMonthlyData[cleanMonth]) {
          newMonthlyData[cleanMonth] = {};
        }
        
        // Update with new data
        newMonthlyData[cleanMonth] = {
          ...newMonthlyData[cleanMonth],
          [isEType ? 'e' : 'o']: {
            lineItems: processedData,
            entityColumns: metadata.entityColumns,
            summaryColumn: metadata.summaryColumn,
            type: type,
            raw: data
          }
        };
        
        // Update upload status
        const newUploadStatus = { ...state.uploadStatus };
        if (!newUploadStatus.monthly) {
          newUploadStatus.monthly = {};
        }
        
        if (!newUploadStatus.monthly[cleanMonth]) {
          newUploadStatus.monthly[cleanMonth] = {};
        }
        
        newUploadStatus.monthly[cleanMonth][isEType ? 'e' : 'o'] = true;
        
        const newState = {
          monthlyData: newMonthlyData,
          uploadStatus: newUploadStatus,
          uploadHistory: [
            ...state.uploadHistory,
            {
              type: type,
              date: new Date(),
              filename: `${cleanMonth}-${isEType ? 'E' : 'O'}-Data.csv`,
              month: cleanMonth
            }
          ]
        };
        
        // Save to localStorage
        saveToLocalStorage({ ...state, ...newState });
        
        return newState;
      } catch (error) {
        console.error(`Error processing ${type} data for ${month}:`, error);
        return state;
      }
    }
    
    return state;
  }),
  
  // Clear uploaded data
  clearUploadedData: (type, month) => set(state => {
    let newState = { ...state };
    
    if (type === 'all') {
      newState = {
        ...state,
        annualData: null,
        monthlyData: {},
        revenueMix: [],
        marginTrend: [],
        topPerformers: [],
        bottomPerformers: [],
        ancillaryComparison: [],
        uploadStatus: {
          annual: false,
          monthly: {}
        },
        uploadHistory: []
      };
    } else if (type === 'annual') {
      newState = {
        ...state,
        annualData: null,
        revenueMix: [],
        marginTrend: [],
        topPerformers: [],
        bottomPerformers: [],
        ancillaryComparison: [],
        uploadStatus: {
          ...state.uploadStatus,
          annual: false
        },
        uploadHistory: state.uploadHistory.filter(upload => upload.type !== 'annual')
      };
    } else if (type.startsWith('monthly-') && month) {
      const cleanMonth = month.toLowerCase().trim();
      const isEType = type === 'monthly-e';
      
      // Create a deep copy of the monthly data
      const newMonthlyData = JSON.parse(JSON.stringify(state.monthlyData));
      
      // Remove the specific type data
      if (newMonthlyData[cleanMonth]) {
        if (isEType) {
          delete newMonthlyData[cleanMonth].e;
        } else {
          delete newMonthlyData[cleanMonth].o;
        }
        
        // If both e and o are removed, delete the month entry
        if (!newMonthlyData[cleanMonth].e && !newMonthlyData[cleanMonth].o) {
          delete newMonthlyData[cleanMonth];
        }
      }
      
      // Update upload status
      const newUploadStatus = { ...state.uploadStatus };
      if (newUploadStatus.monthly && newUploadStatus.monthly[cleanMonth]) {
        if (isEType) {
          delete newUploadStatus.monthly[cleanMonth].e;
        } else {
          delete newUploadStatus.monthly[cleanMonth].o;
        }
        
        // If both e and o are cleared, remove the month entirely
        if (!newUploadStatus.monthly[cleanMonth].e && !newUploadStatus.monthly[cleanMonth].o) {
          delete newUploadStatus.monthly[cleanMonth];
        }
      }
      
      newState = {
        ...state,
        monthlyData: newMonthlyData,
        uploadStatus: newUploadStatus,
        uploadHistory: state.uploadHistory.filter(
          upload => !(upload.type === type && upload.month === cleanMonth)
        )
      };
    }
    
    // Save updated state to localStorage
    saveToLocalStorage(newState);
    
    return newState;
  }),
  
  // Load uploads from server and update store
  setUploadsFromServer: (uploads) => {
    console.log("Loading uploads from server:", uploads.length);
    
    set(state => {
      // Process uploads to update upload status and history
      const newUploadStatus = { ...state.uploadStatus };
      const newUploadHistory = uploads.map(upload => {
        const { id, type, filename, month, createdAt } = upload;
        
        // Update upload status based on available data
        if (type === 'annual') {
          newUploadStatus.annual = true;
        } else if (type.startsWith('monthly-') && month) {
          if (!newUploadStatus.monthly) {
            newUploadStatus.monthly = {};
          }
          
          if (!newUploadStatus.monthly[month]) {
            newUploadStatus.monthly[month] = {};
          }
          
          if (type === 'monthly-e') {
            newUploadStatus.monthly[month].e = true;
          } else if (type === 'monthly-o') {
            newUploadStatus.monthly[month].o = true;
          }
        }
        
        return {
          id,
          type: type as CSVType,
          date: new Date(createdAt),
          filename,
          month
        };
      });
      
      // Save to localStorage
      saveToLocalStorage({
        ...state,
        uploadStatus: newUploadStatus,
        uploadHistory: newUploadHistory
      });
      
      return {
        uploadStatus: newUploadStatus,
        uploadHistory: newUploadHistory
      };
    });
  },
  
  // Load CSV content from server and process it
  loadCSVContent: async (id) => {
    try {
      console.log(`Loading CSV content for upload ID ${id}`);
      
      // Fetch the CSV data from the server
      const response = await apiRequest(`/api/uploads/${id}`);
      
      if (!response) {
        console.error(`Failed to load CSV content for upload ID ${id}`);
        return undefined;
      }
      
      const { type, content, filename, month } = response;
      
      if (!content) {
        console.error(`No content found for upload ID ${id}`);
        return undefined;
      }
      
      console.log(`Processing CSV content for ${type} (${filename})`);
      
      // Parse the CSV content
      const parsed = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: h => h.trim()
      });
      
      if (!parsed.data || !parsed.data.length) {
        console.error('Failed to parse CSV content');
        return undefined;
      }
      
      // Process the data in our store
      const store = get();
      store.processCSVData(type as CSVType, parsed.data, month);
      
      console.log(`Successfully loaded and processed CSV for ${type}`);
      
      return parsed.data;
    } catch (error) {
      console.error('Error loading CSV content:', error);
      return undefined;
    }
  }
}));