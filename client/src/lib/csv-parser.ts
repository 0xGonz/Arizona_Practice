import { AnnualCSVRow, MonthlyCSVRow, CSVType } from "@/types";

/**
 * Parses a raw CSV value string to a number
 * Handles dollar signs, commas, and parentheses for negative values
 */
export function parseFinancialValue(value: string): number {
  if (!value) return 0;
  
  // Remove dollar signs and commas
  let cleanValue = value.replace(/\$|,/g, '');
  
  // Handle parentheses for negative values
  if (cleanValue.startsWith('(') && cleanValue.endsWith(')')) {
    cleanValue = '-' + cleanValue.substring(1, cleanValue.length - 1);
  }
  
  return parseFloat(cleanValue) || 0;
}

/**
 * Processes an Annual CSV file
 */
export function processAnnualCSV(data: AnnualCSVRow[]) {
  // Find the columns for each month and the total
  const firstRow = data[0];
  const columns = Object.keys(firstRow);
  
  // Identify monthly columns (e.g., "2024(Jan)", "2024(Feb)")
  const monthColumns = columns.filter(col => 
    col !== 'Line Item' && 
    !col.toLowerCase().includes('total')
  );
  
  // Identify the total column (e.g., "2024 Total")
  const totalColumn = columns.find(col => 
    col.toLowerCase().includes('total')
  );
  
  // Extract hierarchical line items and their values
  const lineItems = data.map(row => {
    const lineItem = row['Line Item'];
    
    // Determine the depth of the line item based on indentation or naming convention
    // This is a simplified approach - actual implementation would depend on the CSV structure
    const depth = lineItem.startsWith(' ') ? 
      (lineItem.length - lineItem.trimStart().length) / 2 : 0;
    
    // Extract values for each month
    const monthlyValues = monthColumns.reduce((acc, month) => {
      acc[month] = parseFinancialValue(row[month]);
      return acc;
    }, {} as Record<string, number>);
    
    // Extract the total value
    const totalValue = totalColumn ? 
      parseFinancialValue(row[totalColumn]) : 
      Object.values(monthlyValues).reduce((sum, value) => sum + value, 0);
    
    return {
      name: lineItem.trim(),
      depth,
      monthlyValues,
      totalValue
    };
  });
  
  return {
    lineItems,
    monthColumns,
    totalColumn
  };
}

/**
 * Processes a Monthly E or O CSV file
 */
export function processMonthlyCSV(data: MonthlyCSVRow[], type: 'monthly-e' | 'monthly-o') {
  // Find the columns for each entity and the total
  const firstRow = data[0];
  const columns = Object.keys(firstRow);
  
  // Identify entity columns (all columns except 'Line Item' and the summary column)
  const entityColumns = columns.filter(col => 
    col !== 'Line Item' && 
    !col.toLowerCase().includes('all')
  );
  
  // Identify the summary column (e.g., "All Employees" or "All Entities")
  const summaryColumn = columns.find(col => 
    col.toLowerCase().includes('all')
  );
  
  // Extract hierarchical line items and their values
  const lineItems = data.map(row => {
    const lineItem = row['Line Item'];
    
    // Determine the depth of the line item based on indentation or naming convention
    const depth = lineItem.startsWith(' ') ? 
      (lineItem.length - lineItem.trimStart().length) / 2 : 0;
    
    // Extract values for each entity
    const entityValues = entityColumns.reduce((acc, entity) => {
      acc[entity] = parseFinancialValue(row[entity]);
      return acc;
    }, {} as Record<string, number>);
    
    // Extract the summary value
    const summaryValue = summaryColumn ? 
      parseFinancialValue(row[summaryColumn]) : 
      Object.values(entityValues).reduce((sum, value) => sum + value, 0);
    
    return {
      name: lineItem.trim(),
      depth,
      entityValues,
      summaryValue
    };
  });
  
  return {
    lineItems,
    entityColumns,
    summaryColumn,
    type
  };
}

/**
 * Categorizes a line item based on its description
 */
export function categorizeLineItem(lineItem: string): string {
  const lower = lineItem.toLowerCase();
  
  if (lower.includes('revenue') || lower.includes('income') || lower.startsWith('40')) {
    return 'Revenue';
  } else if (lower.includes('payroll') || lower.includes('salary') || lower.includes('wage') || lower.startsWith('60')) {
    return 'Payroll';
  } else if (lower.includes('admin') || lower.startsWith('65')) {
    return 'Admin';
  } else if (lower.includes('ancillary') || lower.includes('injectables') || lower.includes('supplies') || lower.startsWith('67')) {
    return 'Ancillary';
  } else if (lower.includes('operating') || lower.startsWith('70')) {
    return 'Operating';
  } else if (lower.includes('tax') || lower.startsWith('80')) {
    return 'Taxes';
  } else if (lower.includes('other') || lower.startsWith('90')) {
    return 'Other';
  }
  
  return 'Uncategorized';
}

/**
 * Builds a hierarchical structure from flat line items
 */
export function buildHierarchy(lineItems: { name: string; depth: number; }[]) {
  const result: any[] = [];
  const stack: any[] = [{ children: result }];
  
  for (const item of lineItems) {
    // Create a new node for this line item
    const node = { 
      id: Math.random().toString(36).substring(2, 9),
      name: item.name,
      depth: item.depth,
      children: []
    };
    
    // Find the correct parent for this node based on depth
    while (stack.length > item.depth + 1) {
      stack.pop();
    }
    
    // Add this node to its parent's children
    stack[stack.length - 1].children.push(node);
    
    // Add this node to the stack as a potential parent for future nodes
    stack.push(node);
  }
  
  return result;
}
