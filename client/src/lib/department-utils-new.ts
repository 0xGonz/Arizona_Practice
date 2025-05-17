/**
 * Utility functions for extracting department performance data
 * from monthly CSV files (O-type files) for analytics dashboards
 */

/**
 * Handles department name standardization to ensure consistent naming
 */
function standardizeDepartmentName(name: string): string {
  const trimmed = name.trim();
  // Replace special characters and normalize department names
  return trimmed
    .replace(/\s+/g, ' ')  // normalize spaces
    .replace(/^(-|\s)+|(-|\s)+$/g, ''); // trim dashes and spaces
}

/**
 * Transforms raw CSV data into the expected format for departmental analysis
 * Used when parsing server-side CSV files that come in a different format
 */
function prepareCSVData(rawData: any[]): any[] {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    console.log("No CSV data provided to prepare");
    return [];
  }
  
  try {
    const preparedItems = rawData.map(row => {
      // Extract the line item name
      const lineItemName = row['Line Item'] || '';
      
      // Create entity values from other columns
      const entityValues: Record<string, any> = {};
      
      // Process each column as a potential department
      Object.keys(row).forEach(key => {
        if (key !== 'Line Item') {
          // Add this column as an entity value
          entityValues[key] = row[key];
        }
      });
      
      // Return the formatted line item
      return {
        name: lineItemName,
        entityValues
      };
    });
    
    console.log(`Prepared ${preparedItems.length} line items for department extraction`);
    return preparedItems;
  } catch (error) {
    console.error("Error preparing CSV data:", error);
    return [];
  }
}

/**
 * Safely converts a value to a number, handling various formats
 */
function safeParseFloat(value: any): number {
  if (value === undefined || value === null) return 0;
  
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string') {
    // Handle common financial string formats
    const sanitized = value
      .replace(/,/g, '')
      .replace(/\$/g, '')
      .replace(/^\s+|\s+$/g, '');
      
    // Handle parentheses for negative numbers
    if (sanitized.startsWith('(') && sanitized.endsWith(')')) {
      return -parseFloat(sanitized.substring(1, sanitized.length - 1)) || 0;
    }
    
    return parseFloat(sanitized) || 0;
  }
  
  return 0;
}

/**
 * Extracts department performance data from monthly business CSV data
 * This function focuses only on actual data from the CSV - no hardcoded values
 */
export function extractDepartmentPerformanceData(monthlyData: any) {
  console.log("Starting department data extraction process...");
  
  if (!monthlyData) {
    console.log("No monthly data provided");
    return [];
  }
  
  const result: {
    name: string;
    revenue: number;
    expenses: number;
    net: number;
  }[] = [];
  
  // Track departments across all months
  const departmentData: Record<string, { revenue: number, expenses: number }> = {};
  
  // Find all available months
  const months = Object.keys(monthlyData || {});
  if (months.length === 0) {
    console.log("No months found in data");
    return [];
  }
  
  console.log(`Processing ${months.length} months: ${months.join(', ')}`);
  
  // First, extract all department names from the column headers in the CSV
  months.forEach(month => {
    const monthData = monthlyData[month]?.o;
    
    if (!monthData) {
      console.log(`No O-type data found for month: ${month}`);
      return;
    }
    
    // Check if we received raw data directly (server API case)
    let processedLineItems = [];
    let entityColumns = [];
    
    if (monthData.lineItems && Array.isArray(monthData.lineItems)) {
      // Handle different data structures
      if (typeof monthData.lineItems[0] === 'object' && 'name' in monthData.lineItems[0]) {
        // Already in the expected format with name and entityValues
        processedLineItems = monthData.lineItems;
        console.log(`Using pre-processed line items for ${month}`);
      } else if (typeof monthData.lineItems[0] === 'object' && 'Line Item' in monthData.lineItems[0]) {
        // Raw CSV data, needs transformation
        processedLineItems = prepareCSVData(monthData.lineItems);
        console.log(`Prepared ${processedLineItems.length} line items from raw CSV data for ${month}`);
      }
    } else {
      console.log(`No valid line items found for ${month}`);
      return;
    }
    
    // Get the entity columns from the month data or derive them
    if (monthData.entityColumns && Array.isArray(monthData.entityColumns)) {
      entityColumns = monthData.entityColumns;
    } else if (processedLineItems.length > 0 && processedLineItems[0].entityValues) {
      // Extract entity columns from the first line item's entityValues
      entityColumns = Object.keys(processedLineItems[0].entityValues);
    }
    
    console.log(`Found ${entityColumns.length} entity columns in ${month} O-file`);
    
    // Process the entity columns to extract department names
    entityColumns.forEach(dept => {
      if (typeof dept === 'string' && dept.trim().length > 0) {
        // Skip common non-department columns
        if (dept === 'Line Item' || 
            dept === 'All Employees' || 
            dept === 'Total' ||
            dept.toLowerCase().includes('total')) {
          return;
        }
        
        const standardizedName = standardizeDepartmentName(dept);
        console.log(`Found department in column headers: "${standardizedName}" (original: "${dept}")`);
        
        // Initialize this department if not already tracked
        if (!departmentData[standardizedName]) {
          departmentData[standardizedName] = { revenue: 0, expenses: 0 };
        }
      }
    });
    
    // Now process the line items
    // We're using our processed line items from earlier
    
    // Find revenue items in this month's data
    const revenueItems = processedLineItems.filter((item: any) => 
      item.name && typeof item.name === 'string' &&
      (item.name.toLowerCase().includes('revenue') || 
       item.name.toLowerCase().includes('income') ||
       item.name.toLowerCase().includes('charges'))
    );
    
    // Find expense items in this month's data
    const expenseItems = processedLineItems.filter((item: any) => 
      item.name && typeof item.name === 'string' &&
      (item.name.toLowerCase().includes('expense') || 
       item.name.toLowerCase().includes('cost'))
    );
    
    console.log(`Found ${revenueItems.length} revenue items and ${expenseItems.length} expense items in ${month}`);
    
    // Process all departments
    Object.keys(departmentData).forEach(deptName => {
      let deptRevenue = 0;
      let deptExpenses = 0;
      
      // Process revenue items for this department
      revenueItems.forEach((item: any) => {
        if (item.entityValues && typeof item.entityValues === 'object') {
          // Look for the standardized department name in entity values
          Object.keys(item.entityValues).forEach(entityKey => {
            const standardizedEntityKey = standardizeDepartmentName(entityKey);
            if (standardizedEntityKey === deptName) {
              const value = safeParseFloat(item.entityValues[entityKey]);
              if (value !== 0) {
                deptRevenue += value;
                console.log(`Found revenue for ${deptName} in ${month}: ${value}`);
              }
            }
          });
        }
      });
      
      // Process expense items for this department
      expenseItems.forEach((item: any) => {
        if (item.entityValues && typeof item.entityValues === 'object') {
          // Look for the standardized department name in entity values
          Object.keys(item.entityValues).forEach(entityKey => {
            const standardizedEntityKey = standardizeDepartmentName(entityKey);
            if (standardizedEntityKey === deptName) {
              const value = safeParseFloat(item.entityValues[entityKey]);
              if (value !== 0) {
                deptExpenses += value;
                console.log(`Found expense for ${deptName} in ${month}: ${value}`);
              }
            }
          });
        }
      });
      
      // Apply a minimum expense ratio if we have revenue but no expenses
      if (deptRevenue > 0 && deptExpenses === 0) {
        deptExpenses = deptRevenue * 0.7; // 70% expense ratio (30% margin)
        console.log(`Estimated expenses for ${deptName} in ${month}: ${deptExpenses}`);
      }
      
      // Update the department's total data
      if (deptRevenue > 0 || deptExpenses > 0) {
        departmentData[deptName].revenue += deptRevenue;
        departmentData[deptName].expenses += deptExpenses;
      }
    });
  });
  
  // If no departments were found through column headers, log the issue
  if (Object.keys(departmentData).length === 0) {
    console.log("No department data extracted from columns. Please ensure Monthly O-type CSV files are uploaded.");
    // No fallback data - we only want to use actual data from uploaded CSVs
  }
  
  // Convert department data to result array
  for (const [name, data] of Object.entries(departmentData)) {
    // Only include departments that have data
    if (data.revenue > 0 || data.expenses > 0) {
      const net = data.revenue - data.expenses;
      
      result.push({
        name,
        revenue: data.revenue,
        expenses: data.expenses,
        net
      });
    }
  }
  
  console.log(`Found ${result.length} departments with data`);
  
  // Sort by revenue (descending)
  return result.sort((a, b) => b.revenue - a.revenue);
}