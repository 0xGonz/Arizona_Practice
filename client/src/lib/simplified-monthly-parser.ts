import { MonthlyCSVRow } from "@/types";
import { parseFinancialValue } from "./csv-parser";

/**
 * Simplified structure for processed CSV data
 */
export interface SimplifiedProcessedCSV {
  lineItems: LineItem[];
  entityColumns: string[];
  summaryColumn: string | undefined;
  type: 'monthly-e' | 'monthly-o';
}

/**
 * Structure for a line item in the financial data
 */
export interface LineItem {
  id: string;
  name: string;
  depth: number;
  entityValues: Record<string, number>;
  summaryValue: number;
  isTotal?: boolean;
}

/**
 * A simplified, robust CSV processing function that avoids complex hierarchy building
 * and focuses on basic formatting with proper error handling
 */
export function parseMonthlyCSV(data: MonthlyCSVRow[], type: 'monthly-e' | 'monthly-o'): SimplifiedProcessedCSV {
  // Create a default safe result
  const safeResult: SimplifiedProcessedCSV = {
    lineItems: [],
    entityColumns: [],
    summaryColumn: undefined,
    type
  };

  try {
    // Validate input data
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("Invalid data passed to parseMonthlyCSV - not an array or empty");
      return safeResult;
    }

    // Extract column headers, making sure to filter out invalid ones
    const firstRow = data[0] || {};
    const allHeaders = Object.keys(firstRow).filter(Boolean);
    
    // Get headers excluding 'Line Item'
    const headers = allHeaders.filter(h => h !== 'Line Item');
    if (headers.length === 0) {
      console.warn("No valid columns found in CSV data");
      return safeResult;
    }

    // Find summary column (typically "All Employees")
    const summaryColumn = headers.find(h => 
      typeof h === 'string' && h.includes('All')
    );
    
    // Entity columns (everything except the summary column)
    const entityColumns = summaryColumn 
      ? headers.filter(h => h !== summaryColumn)
      : headers;

    console.log(`Processing ${type} CSV with:`, {
      totalRows: data.length,
      entityColumns,
      summaryColumn
    });

    // Process each row into a simple line item with careful validation
    const lineItems = data.map((row, index) => {
      try {
        // Handle the line item text
        const rawLineItem = row['Line Item'];
        const lineItemText = typeof rawLineItem === 'string' 
          ? rawLineItem.replace(/null|undefined/g, '') 
          : String(rawLineItem || '');
        
        // Calculate depth based on leading spaces
        let depth = 0;
        if (lineItemText) {
          const leadingSpaces = lineItemText.length - lineItemText.trimStart().length;
          // Each level of depth is typically 2 spaces of indentation
          depth = Math.floor(leadingSpaces / 2);
        }

        // Process entity values with careful validation
        const entityValues: Record<string, number> = {};
        
        // Safely extract values for each entity
        entityColumns.forEach(entity => {
          try {
            const rawValue = row[entity];
            
            if (rawValue === null || rawValue === undefined) {
              entityValues[entity] = 0;
            } else if (typeof rawValue === 'number') {
              entityValues[entity] = isNaN(rawValue) ? 0 : rawValue;
            } else {
              // Convert string values to numbers using our financial parser
              const cleanString = String(rawValue).trim();
              entityValues[entity] = cleanString ? parseFinancialValue(cleanString) : 0;
            }
          } catch (err) {
            console.warn(`Error parsing value for ${entity} in row ${index}:`, err);
            entityValues[entity] = 0;
          }
        });

        // Calculate summary value
        let summaryValue = 0;
        if (summaryColumn && row[summaryColumn] !== undefined) {
          try {
            const rawSummary = row[summaryColumn];
            if (typeof rawSummary === 'number') {
              summaryValue = isNaN(rawSummary) ? 0 : rawSummary;
            } else if (rawSummary) {
              summaryValue = parseFinancialValue(String(rawSummary).trim());
            }
          } catch (err) {
            console.warn(`Error parsing summary value in row ${index}:`, err);
            // Fallback: sum the entity values
            summaryValue = Object.values(entityValues).reduce((sum, val) => sum + val, 0);
          }
        } else {
          // No summary column or value, so sum the entity values
          summaryValue = Object.values(entityValues).reduce((sum, val) => sum + val, 0);
        }

        // Check if this is a total line
        const name = lineItemText.trim();
        const isTotal = name.toLowerCase().includes('total');
        
        // Create a truly unique ID to avoid React key duplications
        const id = `${name}-${depth}-${index}-${type}-${Math.random().toString(36).substring(2, 9)}`;

        return {
          id,
          name,
          depth,
          entityValues,
          summaryValue,
          isTotal
        };
      } catch (rowError) {
        console.warn(`Error processing row ${index}:`, rowError);
        // Return a safe placeholder for this row
        return {
          id: `error-${index}`,
          name: String(row['Line Item'] || 'Unknown Item'),
          depth: 0,
          entityValues: {},
          summaryValue: 0,
          isTotal: false
        };
      }
    }).filter(Boolean); // Remove any undefined items

    console.log(`Successfully processed ${lineItems.length} line items`);

    // Return the safely processed data
    return {
      lineItems,
      entityColumns,
      summaryColumn,
      type
    };
  } catch (error) {
    console.error("Fatal error in CSV processing:", error);
    return safeResult;
  }
}