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
  try {
    // Validate input data
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn("Empty or invalid data provided to processMonthlyCSV");
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
    
    // Ensure we have valid data structure - filter out invalid rows
    const validData = data.filter(row => row && typeof row === 'object' && row['Line Item'] !== undefined);
    
    if (validData.length === 0) {
      console.error("No valid rows found in CSV data - missing 'Line Item' column");
      return {
        flat: [],
        nested: [],
        meta: {
          entityColumns: [],
          summaryColumn: null,
          type
        },
        raw: data
      };
    }
    
    // Find the columns for entities and the summary
    const firstRow = validData[0];
    const columns = Object.keys(firstRow || {});
    
    // Identify entity columns (all columns except 'Line Item' and summary columns)
    const entityColumns = columns.filter(col => 
      col !== 'Line Item' && 
      col !== '' &&
      !col.toLowerCase().includes('all') &&
      !col.toLowerCase().includes('total')
    );
    
    // Debug the entity columns
    console.log(`Found ${entityColumns.length} entity columns:`, entityColumns);
    
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
    
    // If we still don't have a summary column, just use the first non-Line Item column
    if (!summaryColumn && entityColumns.length > 0) {
      summaryColumn = entityColumns[0];
      console.log("Using first entity column as summary column:", summaryColumn);
    }
    
    console.log(`[${type}] Entity columns:`, entityColumns);
    console.log(`[${type}] Summary column:`, summaryColumn);
    
    // Extract hierarchical line items and their values
    const lineItems = validData.map(row => {
      try {
        // Extract and clean the line item
        const lineItem = String(row['Line Item'] || '').replace(/null|undefined/g, '');
        
        // Determine the depth of the line item based on indentation
        let depth = 0;
        if (lineItem) {
          const leadingSpaces = lineItem.length - lineItem.trimStart().length;
          depth = Math.floor(leadingSpaces / 2);
        }
        
        // Extract values for each entity - with robust error handling
        const entityValues: Record<string, number> = {};
        for (const entity of entityColumns) {
          try {
            const rawValue = row[entity];
            // Handle different value types
            if (rawValue === null || rawValue === undefined) {
              entityValues[entity] = 0;
            } else if (typeof rawValue === 'number') {
              entityValues[entity] = rawValue;
            } else {
              entityValues[entity] = parseFinancialValue(String(rawValue));
            }
          } catch (err) {
            console.warn(`Error parsing value for ${entity}:`, err);
            entityValues[entity] = 0;
          }
        }
        
        // Extract or calculate the summary value
        let summaryValue = 0;
        if (summaryColumn && row[summaryColumn] !== undefined && row[summaryColumn] !== null) {
          try {
            const rawSummary = row[summaryColumn];
            if (typeof rawSummary === 'number') {
              summaryValue = rawSummary;
            } else {
              summaryValue = parseFinancialValue(String(rawSummary));
            }
          } catch (err) {
            console.warn(`Error parsing summary value:`, err);
            // Fall back to calculating sum from entity values
            summaryValue = Object.values(entityValues).reduce((sum, value) => sum + value, 0);
          }
        } else {
          // Calculate by summing all entity values
          summaryValue = Object.values(entityValues).reduce((sum, value) => sum + value, 0);
        }
        
        // Generate a unique ID for this item
        const trimmedName = lineItem.trim();
        const id = `${trimmedName}-${depth}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Check if this is a "total" line item
        const isTotal = trimmedName.toLowerCase().includes('total');
        
        return {
          id,
          name: trimmedName,
          originalLineItem: lineItem,
          depth,
          entityValues,
          summaryValue,
          isTotal
        };
      } catch (rowError) {
        console.error("Error processing row:", rowError);
        // Return a safe placeholder for invalid rows
        return {
          id: `error-${Math.random().toString(36).substring(2, 9)}`,
          name: String(row['Line Item'] || 'Unknown item'),
          originalLineItem: String(row['Line Item'] || ''),
          depth: 0,
          entityValues: {} as Record<string, number>,
          summaryValue: 0,
          isTotal: false
        };
      }
    });
    
    // Debug the processed line items
    console.log(`Processed ${lineItems.length} line items`);
    
    // Build the nested structure using our utility (with error handling)
    let nested = [];
    try {
      // Make sure we're passing a valid array to buildHierarchy
      if (Array.isArray(lineItems) && lineItems.length > 0) {
        nested = buildHierarchy(lineItems);
        console.log(`Built hierarchy with ${nested.length} top-level items`);
      } else {
        console.warn("No valid line items to build hierarchy from");
      }
    } catch (hierarchyError) {
      console.error("Error building hierarchy:", hierarchyError);
    }
    
    // Return the processed structure with careful validation to prevent errors
    const result: ProcessedCSV = {
      flat: Array.isArray(lineItems) ? lineItems : [],
      nested: Array.isArray(nested) ? nested : [],
      meta: {
        entityColumns: Array.isArray(entityColumns) ? entityColumns : [],
        summaryColumn: summaryColumn || null,
        type
      },
      raw: Array.isArray(data) ? data : []
    };
    
    return result;
  } catch (error) {
    console.error("CSV processing error:", error);
    // Return a safe default structure on error
    return {
      flat: [],
      nested: [],
      meta: {
        entityColumns: [],
        summaryColumn: null,
        type
      },
      raw: Array.isArray(data) ? data : []
    };
  }
}