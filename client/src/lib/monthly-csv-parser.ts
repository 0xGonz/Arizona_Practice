import { CSVType, MonthlyCSVRow } from "@/types";
import { parseFinancialValue } from "./csv-parser";
import { buildHierarchy } from "./hierarchy-utils";

/**
 * Enhanced processing for Monthly CSV files
 * Returns both flat and hierarchical structures for better data visualization
 */
export interface ProcessedCSV {
  flat: any[];
  nested: any[];
  meta: {
    summaryColumn: string | null;
    entityColumns: string[];
    type: 'monthly-e' | 'monthly-o';
  };
  raw: MonthlyCSVRow[];
}

export function processMonthlyCSV(data: MonthlyCSVRow[], type: 'monthly-e' | 'monthly-o'): ProcessedCSV {
  if (!data || data.length === 0) {
    return {
      flat: [],
      nested: [],
      meta: {
        entityColumns: [],
        summaryColumn: null,
        type
      },
      raw: []
    };
  }
  
  // Find the columns for entities and the summary
  const firstRow = data[0];
  const columns = Object.keys(firstRow);
  
  // Identify entity columns (all columns except 'Line Item' and summary columns)
  const entityColumns = columns.filter(col => 
    col !== 'Line Item' && 
    col !== '' &&
    !col.toLowerCase().includes('all') &&
    !col.toLowerCase().includes('total')
  );
  
  // Identify the summary column (e.g., "All Employees", empty column, or "Total")
  let summaryColumn = columns.find(col => 
    col.toLowerCase().includes('all')
  );
  
  // If no "All" column, try empty column (often used for totals)
  if (!summaryColumn) {
    summaryColumn = columns.find(col => col === '');
  }
  
  // If still no summary column, try "Total" column
  if (!summaryColumn) {
    summaryColumn = columns.find(col => 
      col.toLowerCase().includes('total')
    );
  }
  
  console.log(`[${type}] Entity columns:`, entityColumns);
  console.log(`[${type}] Summary column:`, summaryColumn);
  
  // Extract hierarchical line items and their values
  const lineItems = data
    .filter(row => row['Line Item'] !== undefined)
    .map(row => {
      const lineItem = row['Line Item'];
      
      // Determine the depth of the line item based on indentation
      let depth = 0;
      if (lineItem) {
        const leadingSpaces = lineItem.length - lineItem.trimStart().length;
        depth = Math.floor(leadingSpaces / 2);
      }
      
      // Extract values for each entity
      const entityValues = entityColumns.reduce((acc, entity) => {
        acc[entity] = parseFinancialValue(row[entity] || '0');
        return acc;
      }, {} as Record<string, number>);
      
      // Extract the summary value
      let summaryValue = 0;
      if (summaryColumn && row[summaryColumn] !== undefined) {
        summaryValue = parseFinancialValue(row[summaryColumn]);
      } else {
        // Calculate by summing all entity values
        summaryValue = Object.values(entityValues).reduce((sum, value) => sum + value, 0);
      }
      
      // Generate a unique ID for this item
      const id = `${lineItem.trim()}-${depth}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Check if this is a "total" line item
      const isTotal = lineItem.trim().toLowerCase().includes('total');
      
      return {
        id,
        name: lineItem.trim(),
        originalLineItem: lineItem,
        depth,
        entityValues,
        summaryValue,
        isTotal
      };
    });
  
  // Build the nested structure using our utility
  const nested = buildHierarchy(lineItems);
  
  // Return an enhanced object with both flat and nested data
  return {
    flat: lineItems,
    nested: nested,
    meta: {
      entityColumns,
      summaryColumn: summaryColumn || null,
      type
    },
    raw: data
  };
}