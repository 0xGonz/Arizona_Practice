import { create } from 'zustand';
import { CSVType, UploadStatus, MarginTrendPoint, RevenueMixItem, PerformerData, ComparisonData } from '@/types';
import { processAnnualCSV, parseFinancialValue } from '@/lib/csv-parser';
import { parseMonthlyCSV } from '@/lib/simplified-monthly-parser';

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
    
    if (value > 0) {
      revenueItems.push({
        name,
        value,
        color: colors[index % colors.length]
      });
    }
  });
  
  return revenueItems;
}

function generateMarginTrend(data: any[]): MarginTrendPoint[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const marginTrend: MarginTrendPoint[] = [];
  
  // Find revenue and expense rows
  const revenueRow = data.find(row => row['Line Item'] && row['Line Item'].includes('Total Revenue'));
  const expenseRow = data.find(row => 
    row['Line Item'] && (
      row['Line Item'].includes('Total Expense') || 
      row['Line Item'].includes('Total Operating Expenses')
    )
  );
  
  if (revenueRow && expenseRow) {
    months.forEach(month => {
      const monthCol = Object.keys(revenueRow).find(key => key.includes(month));
      if (monthCol) {
        const revenue = parseFinancialValue(revenueRow[monthCol]);
        const expenses = parseFinancialValue(expenseRow[monthCol]);
        const marginValue = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;
        
        marginTrend.push({
          month,
          value: parseFloat(marginValue.toFixed(2))
        });
      }
    });
  }
  
  return marginTrend;
}

function generateTopPerformers(data: any[]): PerformerData[] {
  // This would normally look at provider data, but for now we'll generate from departments
  const performers: PerformerData[] = [];
  const departmentRows = data.filter(row => 
    row['Line Item'] && 
    row['Total'] &&
    !row['Line Item'].includes('Total') &&
    row['Line Item'].includes('Department')
  );
  
  departmentRows.slice(0, 5).forEach((row, index) => {
    const name = row['Line Item'].replace('Department', '').trim();
    const value = parseFinancialValue(row['Total']);
    
    if (value > 0) {
      const initials = name.split(' ')
        .map((word: string) => word[0])
        .join('')
        .toUpperCase();
      
      performers.push({
        id: `dept-${index}`,
        name,
        value,
        percentage: 100 * (index + 1) / (departmentRows.length || 1),
        initials
      });
    }
  });
  
  // If we don't have department data, create some generic entries based on revenue
  if (performers.length === 0) {
    const revenueItems = generateRevenueMix(data);
    revenueItems.forEach((item, index) => {
      const words = item.name.split(' ');
      const initials = words.length > 1 
        ? `${words[0][0]}${words[1][0]}`.toUpperCase()
        : `${item.name.substring(0, 2)}`.toUpperCase();
      
      performers.push({
        id: `rev-${index}`,
        name: item.name,
        value: item.value,
        percentage: 100 * (index + 1) / (revenueItems.length || 1),
        initials
      });
    });
  }
  
  return performers.sort((a, b) => b.value - a.value);
}

function generateBottomPerformers(data: any[]): PerformerData[] {
  // For bottom performers, we'll look at expense items
  const performers: PerformerData[] = [];
  const expenseRows = data.filter(row => 
    row['Line Item'] && 
    row['Total'] &&
    !row['Line Item'].includes('Total') &&
    (
      row['Line Item'].includes('Expense') ||
      /^\s*[56]\d{4}/.test(row['Line Item']) // Items starting with 5xxxx or 6xxxx are typically expenses
    )
  );
  
  expenseRows.slice(0, 5).forEach((row, index) => {
    const name = row['Line Item'].trim();
    const value = parseFinancialValue(row['Total']);
    
    if (value > 0) {
      const words = name.split(' ');
      const initials = words.length > 1 
        ? `${words[0][0]}${words[1][0]}`.toUpperCase()
        : `${name.substring(0, 2)}`.toUpperCase();
      
      performers.push({
        id: `exp-${index}`,
        name,
        value,
        percentage: 100 * (index + 1) / (expenseRows.length || 1),
        initials
      });
    }
  });
  
  return performers.sort((a, b) => b.value - a.value);
}

function generateAncillaryComparison(data: any[]): ComparisonData[] {
  const comparison: ComparisonData[] = [
    { category: 'Revenue', professional: 0, ancillary: 0 },
    { category: 'Expenses', professional: 0, ancillary: 0 },
    { category: 'Net Margin', professional: 0, ancillary: 0 }
  ];
  
  // Find professional revenue
  const professionalRevenueRow = data.find(row => 
    row['Line Item'] && (
      row['Line Item'].includes('Professional Revenue') ||
      row['Line Item'].includes('Professional Fees')
    )
  );
  
  // Find ancillary revenue
  const ancillaryRevenueRow = data.find(row => 
    row['Line Item'] && row['Line Item'].includes('Ancillary')
  );
  
  if (professionalRevenueRow && professionalRevenueRow['Total']) {
    comparison[0].professional = parseFinancialValue(professionalRevenueRow['Total']);
  }
  
  if (ancillaryRevenueRow && ancillaryRevenueRow['Total']) {
    comparison[0].ancillary = parseFinancialValue(ancillaryRevenueRow['Total']);
  }
  
  // For expenses and margins, we would need more specific data
  // For now, let's estimate based on typical ratios
  comparison[1].professional = comparison[0].professional * 0.7; // 70% of revenue
  comparison[1].ancillary = comparison[0].ancillary * 0.6; // 60% of revenue
  
  comparison[2].professional = comparison[0].professional - comparison[1].professional;
  comparison[2].ancillary = comparison[0].ancillary - comparison[1].ancillary;
  
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
      e?: any[] | null;
      o?: any[] | null;
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
    type: CSVType;
    date: Date;
    filename: string;
    month?: string;
  }[];
}

// Load initial data from localStorage if available
const loadFromLocalStorage = () => {
  if (typeof window === 'undefined') return null; // Skip on server-side
  
  try {
    // Load upload status
    const savedUploadStatus = localStorage.getItem('uploadStatus');
    const uploadStatus = savedUploadStatus ? JSON.parse(savedUploadStatus) : null;

    // Load saved data
    const savedAnnualData = localStorage.getItem('annualData');
    const savedMonthlyData = localStorage.getItem('monthlyData');
    const savedRevenueMix = localStorage.getItem('revenueMix');
    const savedMarginTrend = localStorage.getItem('marginTrend');
    const savedTopPerformers = localStorage.getItem('topPerformers');
    const savedBottomPerformers = localStorage.getItem('bottomPerformers');
    const savedAncillaryComparison = localStorage.getItem('ancillaryComparison');
    const savedUploadHistory = localStorage.getItem('uploadHistory');

    return {
      uploadStatus: uploadStatus,
      annualData: savedAnnualData ? JSON.parse(savedAnnualData) : null,
      monthlyData: savedMonthlyData ? JSON.parse(savedMonthlyData) : {},
      revenueMix: savedRevenueMix ? JSON.parse(savedRevenueMix) : [],
      marginTrend: savedMarginTrend ? JSON.parse(savedMarginTrend) : [],
      topPerformers: savedTopPerformers ? JSON.parse(savedTopPerformers) : [],
      bottomPerformers: savedBottomPerformers ? JSON.parse(savedBottomPerformers) : [],
      ancillaryComparison: savedAncillaryComparison ? JSON.parse(savedAncillaryComparison) : [],
      uploadHistory: savedUploadHistory ? JSON.parse(savedUploadHistory) : []
    };
  } catch (error) {
    console.error("Error loading data from localStorage:", error);
    return null;
  }
};

// Get initial state
const initialState = typeof window !== 'undefined' ? loadFromLocalStorage() : null;

// Default upload status
const defaultUploadStatus = {
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
};

export const useStore = create<DataStore>((set, get) => ({
  // Initial state
  uploadStatus: initialState?.uploadStatus || defaultUploadStatus,
  annualData: initialState?.annualData || null,
  monthlyData: initialState?.monthlyData || {},
  revenueMix: initialState?.revenueMix || [],
  marginTrend: initialState?.marginTrend || [],
  topPerformers: initialState?.topPerformers || [],
  bottomPerformers: initialState?.bottomPerformers || [],
  ancillaryComparison: initialState?.ancillaryComparison || [],
  uploadHistory: initialState?.uploadHistory || [],

  // Clear uploaded data
  clearUploadedData: (type, month) => set((state) => {
    console.log(`Clearing data type: ${type}, month: ${month || 'N/A'}`);
    let newUploadStatus = { ...state.uploadStatus };
    let newMonthlyData = { ...state.monthlyData };
    let newUploadHistory = [...state.uploadHistory];
    
    // Handle clearing all data
    if (type === 'all') {
      // Clear everything and reset to defaults
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('annualData');
          localStorage.removeItem('monthlyData');
          localStorage.removeItem('revenueMix');
          localStorage.removeItem('marginTrend');
          localStorage.removeItem('topPerformers');
          localStorage.removeItem('bottomPerformers');
          localStorage.removeItem('ancillaryComparison');
          localStorage.removeItem('uploadHistory');
          localStorage.setItem('uploadStatus', JSON.stringify(defaultUploadStatus));
        } catch (error) {
          console.error('Error clearing all data from localStorage:', error);
        }
      }
      
      return {
        uploadStatus: defaultUploadStatus,
        annualData: null,
        monthlyData: {},
        revenueMix: [],
        marginTrend: [],
        topPerformers: [],
        bottomPerformers: [],
        ancillaryComparison: [],
        uploadHistory: []
      };
    }
    
    // Handle annual data
    if (type === 'annual') {
      newUploadStatus.annual = false;
      newUploadHistory = newUploadHistory.filter(item => item.type !== 'annual');
      
      // Clear annual data in localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('annualData');
          localStorage.removeItem('revenueMix');
          localStorage.removeItem('marginTrend');
          localStorage.removeItem('topPerformers');
          localStorage.removeItem('bottomPerformers');
          localStorage.removeItem('ancillaryComparison');
          localStorage.setItem('uploadHistory', JSON.stringify(newUploadHistory));
          localStorage.setItem('uploadStatus', JSON.stringify(newUploadStatus));
        } catch (error) {
          console.error('Error clearing annual data from localStorage:', error);
        }
      }
      
      return {
        uploadStatus: newUploadStatus,
        annualData: null,
        revenueMix: [],
        marginTrend: [],
        topPerformers: [],
        bottomPerformers: [],
        ancillaryComparison: [],
        uploadHistory: newUploadHistory
      };
    }
    
    // Handle monthly data
    if ((type === 'monthly-e' || type === 'monthly-o') && month) {
      // Update upload status
      if (type === 'monthly-e') {
        newUploadStatus.monthly[month].e = false;
      } else {
        newUploadStatus.monthly[month].o = false;
      }
      
      // Update upload history
      newUploadHistory = newUploadHistory.filter(item => 
        !(item.type === type && item.month === month)
      );
      
      // Remove the specific data type from the monthly data
      if (newMonthlyData[month]) {
        const newMonthData = { ...newMonthlyData[month] };
        if (type === 'monthly-e') {
          delete newMonthData.e;
        } else {
          delete newMonthData.o;
        }
        newMonthlyData[month] = newMonthData;
      }
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('monthlyData', JSON.stringify(newMonthlyData));
          localStorage.setItem('uploadHistory', JSON.stringify(newUploadHistory));
          localStorage.setItem('uploadStatus', JSON.stringify(newUploadStatus));
        } catch (error) {
          console.error('Error clearing monthly data from localStorage:', error);
        }
      }
      
      return {
        monthlyData: newMonthlyData,
        uploadStatus: newUploadStatus,
        uploadHistory: newUploadHistory
      };
    }
    
    return state;
  }),
  
  // Helper function to save to localStorage
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
    
    const updatedState = { uploadStatus: newStatus };
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('uploadStatus', JSON.stringify(newStatus));
      } catch (error) {
        console.error('Error saving upload status to localStorage:', error);
      }
    }
    
    return updatedState;
  }),
  
  processCSVData: (type, data, month) => set((state) => {
    if (type === 'annual') {
      console.log("Processing annual data in store");
      
      try {
        // Generate data for visualizations
        const generatedRevenueMix = generateRevenueMix(data);
        const generatedMarginTrend = generateMarginTrend(data);
        const generatedTopPerformers = generateTopPerformers(data);
        const generatedBottomPerformers = generateBottomPerformers(data);
        const generatedAncillaryComparison = generateAncillaryComparison(data);
        
        // Add to upload history
        const newUploadHistory = [...state.uploadHistory, {
          type: 'annual',
          date: new Date(),
          filename: 'annual_data.csv'
        }];
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('annualData', JSON.stringify(data));
            localStorage.setItem('revenueMix', JSON.stringify(generatedRevenueMix));
            localStorage.setItem('marginTrend', JSON.stringify(generatedMarginTrend));
            localStorage.setItem('topPerformers', JSON.stringify(generatedTopPerformers));
            localStorage.setItem('bottomPerformers', JSON.stringify(generatedBottomPerformers));
            localStorage.setItem('ancillaryComparison', JSON.stringify(generatedAncillaryComparison));
            localStorage.setItem('uploadHistory', JSON.stringify(newUploadHistory));
          } catch (error) {
            console.error('Error saving annual data to localStorage:', error);
          }
        }
        
        return { 
          annualData: data,
          revenueMix: generatedRevenueMix,
          marginTrend: generatedMarginTrend,
          topPerformers: generatedTopPerformers,
          bottomPerformers: generatedBottomPerformers,
          ancillaryComparison: generatedAncillaryComparison,
          uploadHistory: newUploadHistory
        };
      } catch (error) {
        console.error("Error processing annual data:", error);
        return { annualData: data };
      }
      
    } else if (type === 'monthly-e' && month) {
      try {
        // Process the monthly data with enhanced parser
        console.log(`Processing monthly-e data for ${month}`, data ? data.length : 0, "rows");
        
        // Validate data structure before processing
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.error("Invalid data structure for monthly-e processing");
          throw new Error("Invalid data structure. CSV data must contain at least one row.");
        }
        
        // Ensure we have 'Line Item' column
        const firstRow = data[0];
        if (!firstRow || !('Line Item' in firstRow)) {
          console.error("CSV is missing the 'Line Item' column", firstRow);
          throw new Error("CSV must contain a 'Line Item' column");
        }
        
        // Use our simplified parser that is more robust against errors
        const processedData = parseMonthlyCSV(data, 'monthly-e');
        
        console.log(`Processed monthly-e data with ${processedData.lineItems.length} line items and ${processedData.entityColumns.length} entity columns`);
        
        // Add to upload history
        const newUploadHistory = Array.isArray(state.uploadHistory) ? 
          [...state.uploadHistory, {
            type: 'monthly-e' as CSVType,
            date: new Date(),
            filename: `${month}_e_data.csv`,
            month
          }] : 
          [{
            type: 'monthly-e' as CSVType,
            date: new Date(),
            filename: `${month}_e_data.csv`,
            month
          }];
        
        // Create or update monthlyData for this month with structured data
        let existingMonthData = {};
        if (state.monthlyData && state.monthlyData[month]) {
          existingMonthData = state.monthlyData[month];
        }
        
        const updatedMonthlyData = {
          ...state.monthlyData,
          [month]: {
            ...existingMonthData,
            e: processedData // Store the complete processed result
          }
        };
        
        // Update the upload status
        let newStatus = { ...state.uploadStatus };
        if (!newStatus.monthly) {
          newStatus.monthly = {};
        }
        if (!newStatus.monthly[month]) {
          newStatus.monthly[month] = { e: true, o: false };
        } else {
          newStatus.monthly[month].e = true;
        }
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('monthlyData', JSON.stringify(updatedMonthlyData));
            localStorage.setItem('uploadHistory', JSON.stringify(newUploadHistory));
            localStorage.setItem('uploadStatus', JSON.stringify(newStatus));
            console.log(`Enhanced monthly-e data saved to localStorage for ${month}`);
          } catch (error) {
            console.error('Error saving monthly-e data to localStorage:', error);
          }
        }
        
        return {
          monthlyData: updatedMonthlyData,
          uploadHistory: newUploadHistory,
          uploadStatus: newStatus
        };
      } catch (error) {
        console.error(`Error processing monthly-e data for ${month}:`, error);
        throw error; // Re-throw for the component to handle
      }
      
    } else if (type === 'monthly-o' && month) {
      try {
        // Process the monthly data with enhanced parser
        console.log(`Processing monthly-o data for ${month}`, data ? data.length : 0, "rows");
        
        // Validate data structure before processing
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.error("Invalid data structure for monthly-o processing");
          throw new Error("Invalid data structure. CSV data must contain at least one row.");
        }
        
        // Ensure we have 'Line Item' column
        const firstRow = data[0];
        if (!firstRow || !('Line Item' in firstRow)) {
          console.error("CSV is missing the 'Line Item' column", firstRow);
          throw new Error("CSV must contain a 'Line Item' column");
        }
        
        // Use our simplified parser that is more robust against errors
        const processedData = parseMonthlyCSV(data, 'monthly-o');
        
        console.log(`Processed monthly-o data with ${processedData.lineItems.length} line items and ${processedData.entityColumns.length} entity columns`);
        
        // Add to upload history
        const newUploadHistory = Array.isArray(state.uploadHistory) ? 
          [...state.uploadHistory, {
            type: 'monthly-o' as CSVType,
            date: new Date(),
            filename: `${month}_o_data.csv`,
            month
          }] : 
          [{
            type: 'monthly-o' as CSVType,
            date: new Date(),
            filename: `${month}_o_data.csv`,
            month
          }];
        
        // Create or update monthlyData for this month with structured data
        let existingMonthData = {};
        if (state.monthlyData && state.monthlyData[month]) {
          existingMonthData = state.monthlyData[month];
        }
        
        const updatedMonthlyData = {
          ...state.monthlyData,
          [month]: {
            ...existingMonthData,
            o: processedData // Store the complete processed result
          }
        };
        
        // Update the upload status
        let newStatus = { ...state.uploadStatus };
        if (!newStatus.monthly) {
          newStatus.monthly = {};
        }
        if (!newStatus.monthly[month]) {
          newStatus.monthly[month] = { e: false, o: true };
        } else {
          newStatus.monthly[month].o = true;
        }
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('monthlyData', JSON.stringify(updatedMonthlyData));
            localStorage.setItem('uploadHistory', JSON.stringify(newUploadHistory));
            localStorage.setItem('uploadStatus', JSON.stringify(newStatus));
            console.log(`Enhanced monthly-o data saved to localStorage for ${month}`);
          } catch (error) {
            console.error('Error saving monthly-o data to localStorage:', error);
          }
        }
        
        return {
          monthlyData: updatedMonthlyData,
          uploadHistory: newUploadHistory,
          uploadStatus: newStatus
        };
      } catch (error) {
        console.error(`Error processing monthly-o data for ${month}:`, error);
        throw error; // Re-throw for the component to handle
      }
    }
    
    return state;
  })
}));