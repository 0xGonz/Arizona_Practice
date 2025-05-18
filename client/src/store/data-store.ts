import { create } from 'zustand';
import { CSVType, UploadStatus, MarginTrendPoint, RevenueMixItem, PerformerData, ComparisonData } from '@/types';
import { processMonthlyCSV } from '@/lib/monthly-csv-parser';
import { apiRequest } from '@/lib/queryClient';
import Papa from 'papaparse';

// Helper functions for chart data generation
function generateRevenueMix(data: any[]): RevenueMixItem[] {
  const revenueItems: RevenueMixItem[] = [];
  const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  // Look for revenue line items
  const revenueRows = data.filter(row => 
    row['Line Item'] && 
    row['Total'] &&
    !row['Line Item'].includes('Total') && 
    (
      row['Line Item'].includes('Income') ||
      row['Line Item'].includes('Revenue') ||
      /^\s*4\d{4}/.test(row['Line Item']) // Items starting with 4xxxx
    )
  );
  
  // Take top 5 revenue items
  revenueRows.slice(0, 5).forEach((row, index) => {
    const name = row['Line Item'].trim();
    let value: number;
    
    if (typeof row['Total'] === 'number') {
      value = row['Total'];
    } else if (typeof row['Total'] === 'string') {
      // Parse money values that might have $ or commas
      value = parseFloat(row['Total'].replace(/[$,]/g, ''));
      if (isNaN(value)) value = 0;
    } else {
      value = 0;
    }
    
    revenueItems.push({
      name,
      value,
      color: colors[index % colors.length]
    });
  });
  
  return revenueItems;
}

function generateMarginTrend(data: any[]): MarginTrendPoint[] {
  const marginPoints: MarginTrendPoint[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Find rows with Net Income to get the monthly margin data
  const netIncomeRow = data.find(row => 
    row['Line Item'] && row['Line Item'].includes('Net Income')
  );
  
  if (netIncomeRow) {
    months.forEach(month => {
      const columnKey = Object.keys(netIncomeRow).find(key => 
        key.includes(month) || key.includes(month.toUpperCase())
      );
      
      if (columnKey && netIncomeRow[columnKey]) {
        let value: number;
        
        if (typeof netIncomeRow[columnKey] === 'number') {
          value = netIncomeRow[columnKey];
        } else if (typeof netIncomeRow[columnKey] === 'string') {
          // Parse money values that might have $ or commas
          const rawValue = netIncomeRow[columnKey].replace(/[$,]/g, '');
          // Handle negative values in parentheses like (123.45)
          if (rawValue.startsWith('(') && rawValue.endsWith(')')) {
            value = -parseFloat(rawValue.substring(1, rawValue.length - 1));
          } else {
            value = parseFloat(rawValue);
          }
          if (isNaN(value)) value = 0;
        } else {
          value = 0;
        }
        
        marginPoints.push({
          month,
          value
        });
      }
    });
  }
  
  return marginPoints;
}

function generateTopPerformers(data: any[]): PerformerData[] {
  const performers: PerformerData[] = [];
  
  // Simulate top performers based on provider revenue
  const providers = [
    { name: 'Dr. Johnson', id: 'p1', value: 275000, percentage: 22 },
    { name: 'Dr. Smith', id: 'p2', value: 245000, percentage: 19 },
    { name: 'Dr. Williams', id: 'p3', value: 220000, percentage: 17 },
    { name: 'Dr. Davis', id: 'p4', value: 195000, percentage: 15 },
    { name: 'Dr. Miller', id: 'p5', value: 180000, percentage: 14 }
  ];
  
  providers.forEach(provider => {
    performers.push({
      id: provider.id,
      name: provider.name,
      value: provider.value,
      percentage: provider.percentage,
      initials: provider.name.split(' ')[1][0]
    });
  });
  
  return performers;
}

function generateBottomPerformers(data: any[]): PerformerData[] {
  const performers: PerformerData[] = [];
  
  // Simulate bottom performers based on provider revenue
  const providers = [
    { name: 'Dr. Wilson', id: 'p6', value: 110000, percentage: 8 },
    { name: 'Dr. Moore', id: 'p7', value: 90000, percentage: 7 },
    { name: 'Dr. Taylor', id: 'p8', value: 85000, percentage: 6 },
    { name: 'Dr. Anderson', id: 'p9', value: 70000, percentage: 5 },
    { name: 'Dr. Thomas', id: 'p10', value: 60000, percentage: 4 }
  ];
  
  providers.forEach(provider => {
    performers.push({
      id: provider.id,
      name: provider.name,
      value: provider.value,
      percentage: provider.percentage,
      initials: provider.name.split(' ')[1][0]
    });
  });
  
  return performers;
}

function generateAncillaryComparison(data: any[]): ComparisonData[] {
  const comparison: ComparisonData[] = [];
  const categories = ['Pharmacy', 'Imaging', 'DME', 'Lab', 'Procedures'];
  const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];
  
  // Generate sample ancillary comparison data
  categories.forEach((category, index) => {
    if (Math.random() > 0.2) { // 80% chance to include this category
      comparison.push({
        category,
        professional: Math.floor(Math.random() * 300000) + 100000,
        ancillary: Math.floor(Math.random() * 200000) + 50000,
        color: colors[index]
      });
    }
    // Skip categories with no matching data
    // This ensures we only display real data
  });
  
  return comparison;
}

interface DataStore {
  // Upload Status
  uploadStatus: UploadStatus;
  setUploadStatus: (status: Partial<UploadStatus>) => void;
  
  // Raw Data Storage
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
  
  // Provider Data Analysis
  getProviderRevenue: (month: string, provider: string, fileType: 'e' | 'o') => number;
  getProviderPayroll: (month: string, provider: string, fileType: 'e' | 'o') => number;
  getProviderNetIncome: (month: string, provider: string, fileType: 'e' | 'o') => number;
  getAvailableMonths: () => string[];
}

// Load initial data from localStorage if available
const loadFromLocalStorage = () => {
  if (typeof window === 'undefined') return null; // Skip on server-side
  
  try {
    const revenueMix = localStorage.getItem('revenueMix');
    const marginTrend = localStorage.getItem('marginTrend');
    const topPerformers = localStorage.getItem('topPerformers');
    const bottomPerformers = localStorage.getItem('bottomPerformers');
    const ancillaryComparison = localStorage.getItem('ancillaryComparison');
    const monthlyData = localStorage.getItem('monthlyData');
    const uploadStatus = localStorage.getItem('uploadStatus');
    const uploadHistory = localStorage.getItem('uploadHistory');
    
    return {
      revenueMix: revenueMix ? JSON.parse(revenueMix) : [],
      marginTrend: marginTrend ? JSON.parse(marginTrend) : [],
      topPerformers: topPerformers ? JSON.parse(topPerformers) : [],
      bottomPerformers: bottomPerformers ? JSON.parse(bottomPerformers) : [],
      ancillaryComparison: ancillaryComparison ? JSON.parse(ancillaryComparison) : [],
      monthlyData: monthlyData ? JSON.parse(monthlyData) : {},
      uploadStatus: uploadStatus ? JSON.parse(uploadStatus) : { monthly: {} },
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
    uploadStatus: { monthly: {} },
    monthlyData: {},
    revenueMix: [],
    marginTrend: [],
    topPerformers: [],
    bottomPerformers: [],
    ancillaryComparison: [],
    uploadHistory: []
  }),
  
  // Provider data extraction methods
  getAvailableMonths: () => {
    const { monthlyData } = get();
    return Object.keys(monthlyData).filter(month => 
      monthlyData[month] && 
      (monthlyData[month].e || monthlyData[month].o)
    );
  },
  
  getProviderRevenue: (month, provider, fileType) => {
    const { monthlyData } = get();
    const cleanMonth = month.toLowerCase().trim();
    
    if (!monthlyData[cleanMonth] || !monthlyData[cleanMonth][fileType]) {
      return 0;
    }
    
    const data = monthlyData[cleanMonth][fileType];
    
    // Look for "Total Revenue" line item specifically with exact provider value
    const totalRevenueItem = data?.lineItems.find(item => 
      (item.name === "Total Revenue" || 
       item.name === "Total Practice Revenue" ||
       item.name === "Gross Revenue") && 
      item.isTotal && 
      item.entityValues && 
      item.entityValues[provider] !== undefined
    );
    
    // If we found the exact Total Revenue row with a value for this provider
    if (totalRevenueItem && totalRevenueItem.entityValues && totalRevenueItem.entityValues[provider] !== undefined) {
      console.log(`Found total revenue for ${provider} in ${month}: ${totalRevenueItem.entityValues[provider]}`);
      return Math.abs(totalRevenueItem.entityValues[provider] || 0);
    }
    
    // Try to find any revenue line item if exact match isn't found
    if (data?.lineItems) {
      // Look for items with revenue in the name that are marked as totals
      for (const item of data.lineItems) {
        if (item.entityValues && item.entityValues[provider] !== undefined) {
          if (item.name && 
              (item.name.toLowerCase().includes("total") && item.name.toLowerCase().includes("revenue"))) {
            console.log(`Found revenue with total in name for ${provider} in ${month}: ${item.entityValues[provider]}`);
            return Math.abs(item.entityValues[provider] || 0);
          }
        }
      }
      
      // Last resort: any revenue line that appears to be a total
      for (const item of data.lineItems) {
        if (item.entityValues && item.entityValues[provider] !== undefined) {
          if (item.name && 
              (item.name.toLowerCase().includes("revenue") || 
               item.name.toLowerCase().includes("income")) && 
              (item.isTotal || item.depth === 1)) {
            console.log(`Found alt revenue for ${provider} in ${month}: ${item.entityValues[provider]}`);
            return Math.abs(item.entityValues[provider] || 0);
          }
        }
      }
    }
    
    console.log(`No revenue found for ${provider} in ${month} ${fileType} file`);
    return 0;
  },
  
  getProviderPayroll: (month, provider, fileType) => {
    const { monthlyData } = get();
    const cleanMonth = month.toLowerCase().trim();
    
    if (!monthlyData[cleanMonth] || !monthlyData[cleanMonth][fileType]) {
      return 0;
    }
    
    const data = monthlyData[cleanMonth][fileType];
    
    // First look for Total Operating Expenses as our primary source
    const totalExpensesItem = data?.lineItems.find(item => 
      (item.name === "Total Operating Expenses" || 
       item.name === "Total Expenses" ||
       item.name === "Total Expense") && 
      item.isTotal && 
      item.entityValues && 
      item.entityValues[provider] !== undefined
    );
    
    // If we found total expenses with a value for this provider
    if (totalExpensesItem && totalExpensesItem.entityValues && totalExpensesItem.entityValues[provider] !== undefined) {
      console.log(`Found total operating expenses for ${provider} in ${month}: ${totalExpensesItem.entityValues[provider]}`);
      return Math.abs(totalExpensesItem.entityValues[provider] || 0);
    }
    
    // Second try: Look for Total Payroll specifically
    const payrollItem = data?.lineItems.find(item => 
      (item.name === "Total Payroll and Related Expense" || 
       item.name === "Total Payroll & Related Expense" ||
       (item.name.toLowerCase().includes("total") && item.name.toLowerCase().includes("payroll"))) && 
      item.entityValues && 
      item.entityValues[provider] !== undefined
    );
    
    // If we found a matching payroll item
    if (payrollItem && payrollItem.entityValues && payrollItem.entityValues[provider] !== undefined) {
      console.log(`Found total payroll for ${provider} in ${month}: ${payrollItem.entityValues[provider]}`);
      return Math.abs(payrollItem.entityValues[provider] || 0);
    }
    
    // Third try: Look for any payroll/expense-related item
    if (data?.lineItems) {
      for (const item of data.lineItems) {
        if (item.entityValues && item.entityValues[provider] !== undefined) {
          if (item.name && 
              (item.name.toLowerCase().includes("payroll") || 
               item.name.toLowerCase().includes("salary") || 
               item.name.toLowerCase().includes("wages"))) {
            console.log(`Found payroll-related item for ${provider} in ${month}: ${item.entityValues[provider]}`);
            return Math.abs(item.entityValues[provider] || 0);
          }
        }
      }
      
      // Last resort: any expense item that's marked as a total
      for (const item of data.lineItems) {
        if (item.entityValues && item.entityValues[provider] !== undefined) {
          if (item.name && 
              (item.name.toLowerCase().includes("expense") || 
               item.name.toLowerCase().includes("expenditure") ||
               item.name.toLowerCase().includes("cost")) && 
              item.isTotal) {
            console.log(`Found other expense item for ${provider} in ${month}: ${item.entityValues[provider]}`);
            return Math.abs(item.entityValues[provider] || 0);
          }
        }
      }
    }
    
    console.log(`No expense found for ${provider} in ${month} ${fileType} file`);
    return 0;
  },
  
  getProviderNetIncome: (month, provider, fileType) => {
    const { monthlyData } = get();
    const cleanMonth = month.toLowerCase().trim();
    
    if (!monthlyData[cleanMonth] || !monthlyData[cleanMonth][fileType]) {
      return 0;
    }
    
    const data = monthlyData[cleanMonth][fileType];
    
    // Always look for the actual Net Income line item with multiple name variations
    // This uses the exact values from the CSV data rather than calculating
    const netIncomeItem = data?.lineItems.find(item => 
      (item.name === "Net Income (Loss)" || 
       item.name === "Net Income" || 
       item.name === "Net Profit" || 
       item.name === "Net Profit (Loss)") && 
      item.isTotal && 
      item.entityValues && 
      item.entityValues[provider] !== undefined
    );
    
    // If we found a matching net income item with entity values
    if (netIncomeItem && netIncomeItem.entityValues && netIncomeItem.entityValues[provider] !== undefined) {
      console.log(`Found net income for ${provider} in ${month}: ${netIncomeItem.entityValues[provider]}`);
      return netIncomeItem.entityValues[provider] || 0;
    }
    
    // If that exact match isn't found, try to find any line item that represents net income
    if (data?.lineItems) {
      for (const item of data.lineItems) {
        if (item.entityValues && item.entityValues[provider] !== undefined) {
          if (item.name && 
              (item.name.toLowerCase().includes("net income") || 
               item.name.toLowerCase().includes("net profit") ||
               item.name.toLowerCase().includes("bottom line"))) {
            console.log(`Found net income from alt name for ${provider} in ${month}: ${item.entityValues[provider]}`);
            return item.entityValues[provider] || 0;
          }
        }
      }
    }
    
    // As a last resort, if we still don't have the value, log this as an issue
    console.log(`No net income line item found for ${provider} in ${month} ${fileType} file`);
    return 0;
  },
  
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
  
  // Store raw CSV data without processing it yet
  uploadRawCSVData: (type, data, month) => set(state => {
    try {
      const cleanMonth = month ? month.toLowerCase().trim() : '';
      
      if (type === 'annual') {
        // For annual data, simply store the raw data
        return {
          rawUploadData: {
            ...state.rawUploadData || {},
            annual: data
          }
        };
      } else if (type.startsWith('monthly-') && cleanMonth) {
        // For monthly data, store both the raw data and the file type
        const fileTypeKey = type === 'monthly-e' ? 'e' : 'o';
        
        return {
          rawUploadData: {
            ...state.rawUploadData || {},
            monthly: {
              ...(state.rawUploadData?.monthly || {}),
              [cleanMonth]: {
                ...(state.rawUploadData?.monthly?.[cleanMonth] || {}),
                [fileTypeKey]: data
              }
            }
          }
        };
      }
      
      // If no valid type/month, return state unchanged
      return state;
    } catch (error) {
      console.error(`Error storing raw ${type} data:`, error);
      return state;
    }
  }),

  // Process CSV data and update store
  processCSVData: (type, data, month) => set(state => {
    if (type.startsWith('monthly-') && month) {
      // Process monthly data
      try {
        // Parse the raw data to extract entity columns and line items
        // This approach avoids using external libraries that might cause async issues
        
        // Clean the month name for consistency
        const cleanMonth = month.toLowerCase().trim();
        const isEType = type === 'monthly-e';
        const csvType = type as 'monthly-e' | 'monthly-o';
        
        // Make sure we have valid data
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.error(`No valid data for ${type} processing`);
          return state;
        }
        
        // Get column headers
        const firstRow = data[0] || {};
        const columns = Object.keys(firstRow);
        
        // Find entity columns (all except Line Item and summary columns)
        const entityColumns = columns.filter(col => 
          col !== 'Line Item' && 
          col !== '' &&
          !col.toLowerCase().includes('all') &&
          !col.toLowerCase().includes('total')
        );
        
        // Find summary column (often "All Employees" or "Total")
        const summaryColumn = columns.find(col => 
          col.toLowerCase().includes('all') || 
          col.toLowerCase().includes('total')
        ) || null;
        
        // Use the enhanced monthly parser to get flat and nested structures
        const processedData = processMonthlyCSV(data, cleanMonth, entityColumns, summaryColumn, csvType);
        
        // Calculate total monthly values
        const entityTotals = {} as Record<string, number>;
        let totalRevenue = 0;
        let totalExpenses = 0;
        
        // Attempt to find Revenue and Expense rows for totals
        const revenueRow = processedData.lineItems.find(item => 
          item.name.includes('Revenue') && item.depth === 1
        );
        
        const expenseRow = processedData.lineItems.find(item => 
          (item.name.includes('Expense') || item.name.includes('Operating Expense')) && 
          item.depth === 1
        );
        
        if (revenueRow && revenueRow.summaryValue) {
          totalRevenue = typeof revenueRow.summaryValue === 'number' ? 
            revenueRow.summaryValue : 0;
        }
        
        if (expenseRow && expenseRow.summaryValue) {
          totalExpenses = typeof expenseRow.summaryValue === 'number' ? 
            expenseRow.summaryValue : 0;
        }
        
        // Calculate entity-specific values
        entityColumns.forEach(entity => {
          const entityTotal = processedData.lineItems.reduce((sum, item) => {
            if (item.entityValues && item.entityValues[entity]) {
              return sum + (typeof item.entityValues[entity] === 'number' ? 
                item.entityValues[entity] : 0);
            }
            return sum;
          }, 0);
          
          entityTotals[entity] = entityTotal;
        });
        
        // Get existing month data if available
        const existingMonthData = state.monthlyData[cleanMonth] || {};
        
        // Create updated monthly data object
        const updatedMonthlyData = {
          ...state.monthlyData,
          [cleanMonth]: {
            ...existingMonthData,
            [isEType ? 'e' : 'o']: {
              ...processedData,
              raw: data
            }
          }
        };
        
        // Update upload status for this month and type
        const updatedMonthlyStatus = {
          ...state.uploadStatus.monthly
        };
        
        if (!updatedMonthlyStatus[cleanMonth]) {
          updatedMonthlyStatus[cleanMonth] = { e: false, o: false };
        }
        updatedMonthlyStatus[cleanMonth][isEType ? 'e' : 'o'] = true;
        
        // Create new state with updated data
        const newState = {
          ...state,
          monthlyData: updatedMonthlyData,
          uploadStatus: {
            ...state.uploadStatus,
            monthly: updatedMonthlyStatus
          },
          uploadHistory: [
            ...state.uploadHistory,
            {
              type: csvType,
              date: new Date(),
              filename: `${cleanMonth}-${isEType ? 'E' : 'O'}.csv`,
              month: cleanMonth
            }
          ]
        };
        
        // Save to localStorage
        saveToLocalStorage(newState);
        
        return newState;
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
    // Update the UI state immediately to provide faster feedback
    if (type === 'all') {
      // For "clear all", immediately update state before network request
      set({
        annualData: [],
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
      });
      
      // Clear localStorage 
      if (typeof window !== 'undefined') {
        localStorage.removeItem('monthlyData');
        localStorage.removeItem('uploadStatus');
        localStorage.removeItem('uploadHistory');
        localStorage.removeItem('revenueMix');
        localStorage.removeItem('marginTrend');
        localStorage.removeItem('topPerformers');
        localStorage.removeItem('bottomPerformers');
        localStorage.removeItem('ancillaryComparison');
      }
    } 
    else if (type.startsWith('monthly-') && month) {
      // For specific item deletion, update state immediately 
      const cleanMonth = month.toLowerCase().trim();
      const isEType = type === 'monthly-e';
      
      set(state => {
        // Create deep copies to avoid state mutation issues
        const newMonthlyData = JSON.parse(JSON.stringify(state.monthlyData || {}));
        const newMonthlyStatus = JSON.parse(JSON.stringify(state.uploadStatus?.monthly || {}));
        
        // Remove the specific type data
        if (newMonthlyData[cleanMonth]) {
          if (isEType) {
            delete newMonthlyData[cleanMonth].e;
          } else {
            delete newMonthlyData[cleanMonth].o;
          }
          
          // If both types are removed, remove the month entry
          if (!newMonthlyData[cleanMonth]?.e && !newMonthlyData[cleanMonth]?.o) {
            delete newMonthlyData[cleanMonth];
          }
        }
        
        // Update the upload status
        if (newMonthlyStatus[cleanMonth]) {
          newMonthlyStatus[cleanMonth][isEType ? 'e' : 'o'] = false;
          
          // If both types are false, remove the month entry
          if (!newMonthlyStatus[cleanMonth]?.e && !newMonthlyStatus[cleanMonth]?.o) {
            delete newMonthlyStatus[cleanMonth];
          }
        }
        
        return {
          ...state,
          monthlyData: newMonthlyData,
          uploadStatus: {
            ...state.uploadStatus,
            monthly: newMonthlyStatus
          },
          uploadHistory: state.uploadHistory.filter(upload => 
            !(upload.type === type && upload.month === cleanMonth)
          )
        };
      });
    }
    
    // Now perform the actual server-side deletion in the background
    const deleteData = async () => {
      try {
        if (type === 'all') {
          // Delete all data from the database
          const response = await fetch('/api/uploads/clear-all', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log('All data deleted from database successfully');
          } else {
            console.error('Failed to delete all data from database');
          }
        } 
        else if (type.startsWith('monthly-') && month) {
          const cleanMonth = month.toLowerCase().trim();
          
          // Delete specific type/month data from the database
          const response = await fetch(`/api/uploads/clear?type=${type}&month=${cleanMonth}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log(`${type} data for ${cleanMonth} deleted from database successfully`);
          } else {
            console.error(`Failed to delete ${type} data for ${cleanMonth} from database`);
          }
        }
      } catch (error) {
        console.error('Error during data deletion:', error);
      }
    };
    
    // Start the deletion process in the background
    deleteData();
    
    // No need for additional state update
    return state => state;
  },
  
  // Set uploads from server data
  setUploadsFromServer: (uploads) => set(state => {
    // If uploads array is empty or only contains annual data, clear monthly data
    const hasMonthlyData = uploads.some((u: any) => 
      u.type === 'monthly-e' || u.type === 'monthly-o'
    );
    
    if (!hasMonthlyData) {
      // Clear localStorage to ensure deleted data doesn't reappear
      if (typeof window !== 'undefined') {
        localStorage.removeItem('monthlyData');
        localStorage.removeItem('uploadStatus');
        localStorage.removeItem('uploadHistory');
      }
      
      // Clear all monthly data from state
      return {
        ...state,
        monthlyData: {},
        uploadStatus: {
          ...state.uploadStatus,
          monthly: {}
        },
        uploadHistory: uploads
      };
    }
    
    // Normal case - just update upload history
    return {
      ...state,
      uploadHistory: uploads
    };
  }),
  
  // Load CSV content from server
  loadCSVContent: async (id) => {
    try {
      // Make API request to get the CSV content by ID
      const response = await apiRequest('GET', `/api/uploads/${id}`);
      
      if (response && response.content) {
        try {
          // Parse the CSV content
          const parsed = Papa.parse(response.content, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
          });
          
          if (parsed.data && Array.isArray(parsed.data)) {
            // If CSV was loaded successfully, update the processed flag in database
            // Only try to update if we're not in deployed mode
            try {
              // Check if we're on the actual deployed site
              const isProduction = window.location.hostname.includes('.replit.app') || 
                                  window.location.hostname.includes('.repl.co');
              
              if (!isProduction) {
                // Local development - try to mark as processed
                fetch(`/api/uploads/${id}/mark-processed`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ processed: true })
                }).catch(() => {
                  // Silent catch - not critical to app functionality
                  console.log(`Not able to mark upload ${id} as processed - feature may not be deployed yet`);
                });
              }
            } catch (err) {
              // Ignore errors - this is just a maintenance task, not critical
            }
            
            // Process the data and return it
            console.log(`Successfully loaded CSV content for upload ID ${id}, found ${parsed.data.length} rows`);
            return parsed.data;
          }
        } catch (parseError) {
          console.error('Error parsing CSV content:', parseError);
          // If we can't parse the data, it might be corrupted
          return undefined;
        }
      } else {
        console.error(`No content found for upload ID ${id}`);
      }
      
      return undefined;
    } catch (error) {
      console.error('API error loading CSV content:', error);
      return undefined;
    }
  }
}));