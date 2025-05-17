import { LineItem, CSVType } from "@/types";
import { parseFinancialValue } from "./csv-parser";

/**
 * Processes a Monthly E or O CSV file and returns a structured result
 * with flat and hierarchical data representations
 */
export function processMonthlyCSV(
  data: any[], 
  month: string,
  entityColumns: string[] = [],
  summaryColumn?: string | null,
  type: 'monthly-e' | 'monthly-o' = 'monthly-e'
): {
  lineItems: any[];
  entityColumns: string[];
  summaryColumn?: string | null;
  type: 'monthly-e' | 'monthly-o';
} {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error('Invalid CSV data for processing');
    return { lineItems: [], entityColumns, summaryColumn };
  }

  console.log(`Processing ${type} data for ${month} with ${data.length} rows`);
  console.log(`Found ${entityColumns.length} entity columns`);
  
  // Track current depth for hierarchical structure
  let currentDepth = 0;
  
  // Process each row
  const lineItems: any[] = [];
  
  data.forEach((row, index) => {
    // Skip empty rows or rows without a Line Item
    if (!row || !row['Line Item']) return;
    
    const lineItemText = row['Line Item'];
    const trimmedLineItem = lineItemText.trim();
    
    // If it's just whitespace, create an empty spacer row
    if (trimmedLineItem === '') {
      lineItems.push({
        id: `-${currentDepth}-${Math.random().toString(36).substring(2, 10)}`,
        name: '',
        originalLineItem: lineItemText,
        depth: currentDepth,
        entityValues: entityColumns.reduce((acc: Record<string, number>, col) => {
          acc[col] = 0;
          return acc;
        }, {}),
        summaryValue: 0,
        isTotal: false
      });
      return;
    }
    
    // Determine depth by counting leading spaces
    const leadingSpaces = lineItemText.length - lineItemText.trimLeft().length;
    currentDepth = Math.floor(leadingSpaces / 2); // Assuming 2 spaces per indent level
    
    // Check if this is a total or summary row
    const isTotal = 
      trimmedLineItem.toLowerCase().includes('total') || 
      trimmedLineItem.endsWith('Total');
    
    // Process values for each entity/employee
    const entityValues: Record<string, number> = {};
    entityColumns.forEach(entity => {
      if (row[entity]) {
        entityValues[entity] = typeof row[entity] === 'number' 
          ? row[entity] 
          : parseFinancialValue(row[entity]);
      } else {
        entityValues[entity] = 0;
      }
    });
    
    // Get summary value if available
    let summaryValue = 0;
    if (summaryColumn && row[summaryColumn]) {
      summaryValue = typeof row[summaryColumn] === 'number' 
        ? row[summaryColumn] 
        : parseFinancialValue(row[summaryColumn]);
    }
    
    // Add to lineItems array
    lineItems.push({
      id: `${trimmedLineItem}-${currentDepth}-${Math.random().toString(36).substring(2, 10)}`,
      name: trimmedLineItem,
      originalLineItem: lineItemText,
      depth: currentDepth,
      entityValues,
      summaryValue,
      isTotal
    });
  });
  
  return {
    lineItems,
    entityColumns,
    summaryColumn,
    type
  };
}