import { db } from "./db";
import { and, eq, desc, sql, inArray, like, gt, gte, lt, lte, or } from "drizzle-orm";
import {
  csvData,
  csvUploads,
  CSVFileType,
  CSVRowType,
  financialLineItems,
  financialValues,
  financialCategories
} from "@shared/schema";
import Papa from 'papaparse';

/**
 * Advanced Financial Data Manager
 * Provides structured storage and querying capabilities for financial line items
 */
export class FinancialDataManager {

  /**
   * Delete financial data based on various filter criteria
   */
  static async deleteFinancialData({
    uploadId,
    lineItemIds,
    month,
    year,
    category,
    fileType,
    deleteAll = false
  }: {
    uploadId?: number;
    lineItemIds?: number[];
    month?: string;
    year?: number;
    category?: string;
    fileType?: CSVFileType;
    deleteAll?: boolean;
  }) {
    try {
      console.log("Deleting financial data with params:", {
        uploadId, lineItemIds, month, year, category, fileType, deleteAll
      });
      
      // Determine which line items to delete
      let lineItemsToDelete: { id: number }[] = [];
      
      // Case 1: Delete by specific uploadId
      if (uploadId) {
        lineItemsToDelete = await db
          .select({ id: financialLineItems.id })
          .from(financialLineItems)
          .where(eq(financialLineItems.uploadId, uploadId));
      }
      // Case 2: Delete specific line items
      else if (lineItemIds && lineItemIds.length > 0) {
        lineItemsToDelete = lineItemIds.map(id => ({ id }));
      }
      // Case 3: Delete by filters
      else {
        const whereConditions: SQL<unknown>[] = [];
        
        if (category) {
          const categories = await db
            .select({ id: financialCategories.id })
            .from(financialCategories)
            .where(eq(financialCategories.name, category));
            
          if (categories.length > 0) {
            whereConditions.push(eq(financialLineItems.categoryId, categories[0].id));
          }
        }
        
        // Add the fileType filter via join to csvUploads
        if (fileType) {
          const uploadsWithType = await db
            .select({ id: csvUploads.id })
            .from(csvUploads)
            .where(eq(csvUploads.type, fileType));
          
          const uploadIds = uploadsWithType.map(u => u.id);
          
          if (uploadIds.length > 0) {
            whereConditions.push(inArray(financialLineItems.uploadId, uploadIds));
          } else {
            // No uploads of this type, return empty result
            return { count: 0 };
          }
        }
        
        // Apply month and year filters via subquery for values
        if (month || year) {
          const valueFilters: SQL<unknown>[] = [];
          
          if (month) {
            valueFilters.push(eq(financialValues.month, month));
          }
          
          if (year) {
            valueFilters.push(eq(financialValues.year, year));
          }
          
          // Get the IDs of line items that have values matching the filters
          const matchingLineItemIds = await db
            .select({ id: financialValues.lineItemId })
            .from(financialValues)
            .where(and(...valueFilters));
          
          const lineItemIdSet = new Set(matchingLineItemIds.map(item => item.id));
          
          if (lineItemIdSet.size > 0) {
            whereConditions.push(inArray(
              financialLineItems.id, 
              Array.from(lineItemIdSet)
            ));
          } else {
            // No matching values, return empty result
            return { count: 0 };
          }
        }
        
        // Delete all data if explicitly requested or if there are no filters
        if (deleteAll || whereConditions.length === 0) {
          // Get all line items (potentially limited by the above filters)
          if (whereConditions.length > 0) {
            lineItemsToDelete = await db
              .select({ id: financialLineItems.id })
              .from(financialLineItems)
              .where(and(...whereConditions));
          } else if (deleteAll) {
            lineItemsToDelete = await db
              .select({ id: financialLineItems.id })
              .from(financialLineItems);
          }
        } else {
          // Get line items matching the filters
          lineItemsToDelete = await db
            .select({ id: financialLineItems.id })
            .from(financialLineItems)
            .where(and(...whereConditions));
        }
      }
      
      // If no line items to delete, return early
      if (lineItemsToDelete.length === 0) {
        return { count: 0 };
      }
      
      const lineItemIds = lineItemsToDelete.map(item => item.id);
      
      // Step 1: Delete all values associated with these line items
      const deletedValues = await db
        .delete(financialValues)
        .where(inArray(financialValues.lineItemId, lineItemIds))
        .returning();
      
      // Step 2: Delete the line items themselves
      const deletedLineItems = await db
        .delete(financialLineItems)
        .where(inArray(financialLineItems.id, lineItemIds))
        .returning();
      
      // Optionally, also clean up orphaned categories and uploads
      // This would be a more advanced feature - for now, we're keeping it simple
      
      return {
        count: deletedLineItems.length,
        deletedValues: deletedValues.length,
        deletedLineItems: deletedLineItems.length
      };
      
    } catch (error) {
      console.error("Error deleting financial data:", error);
      throw new Error(`Failed to delete financial data: ${error}`);
    }
  }
  /**
   * Store structured financial data from a CSV upload
   */
  static async storeStructuredFinancialData(
    uploadId: number,
    content: string,
    type: CSVFileType,
    month?: string
  ): Promise<boolean> {
    try {
      console.log(`Storing structured financial data for upload ${uploadId} (${type})`);
      
      // Parse the CSV content
      const parseResult = Papa.parse(content, {
        header: true,
        skipEmptyLines: true
      });
      
      if (!parseResult.data || parseResult.data.length === 0) {
        console.error('No data found in CSV content');
        return false;
      }
      
      // Get headers and identify the line item column (usually the first column)
      const headers = parseResult.meta.fields || [];
      const lineItemColumnName = headers[0] || 'Line Item';
      
      // Extract the column headers that represent entities (employees/months/departments)
      const entityColumns = headers.filter(h => h !== lineItemColumnName);
      console.log(`Identified ${entityColumns.length} entity columns: ${entityColumns.join(', ')}`);
      
      // Start a transaction for atomicity
      await db.transaction(async (tx) => {
        // First, create financial category entries if they don't exist already
        // Examples: Revenue, Expenses, Income, Assets, Liabilities, etc.
        const topLevelCategories = new Set<string>();
        const rows = parseResult.data as Array<Record<string, string>>;
        
        for (const row of rows) {
          const lineItem = row[lineItemColumnName]?.trim() || '';
          if (lineItem && !lineItem.startsWith(' ')) {
            // This is a top-level category
            topLevelCategories.add(lineItem);
          }
        }
        
        // Store categories
        for (const category of topLevelCategories) {
          // Check if category exists
          const existingCategories = await tx.select()
            .from(financialCategories)
            .where(eq(financialCategories.name, category));
            
          if (existingCategories.length === 0) {
            await tx.insert(financialCategories).values({
              name: category,
              description: `${category} category from ${type} data`,
              createdAt: new Date()
            });
          }
        }
        
        // Process line items with proper hierarchies
        let rowIndex = 0;
        const lineItemMap = new Map<string, number>(); // Maps line item to its ID
        
        for (const row of rows) {
          const rawLineItem = row[lineItemColumnName] || '';
          const lineItem = rawLineItem.trim();
          
          // Skip empty line items
          if (!lineItem) {
            rowIndex++;
            continue;
          }
          
          // Calculate depth from leading spaces (2 spaces = 1 level)
          const leadingSpaces = rawLineItem.match(/^(\s*)/)?.[1].length || 0;
          const depth = Math.floor(leadingSpaces / 2);
          
          // Determine if this is a header, data, or total row
          let rowType: CSVRowType = 'data';
          if (lineItem.toLowerCase().includes('total')) {
            rowType = 'total';
          } else if (depth === 0) {
            rowType = 'header';
          }
          
          // Find parent category or line item
          let parentId: number | null = null;
          if (depth > 0) {
            // Look for parent line item (closest item with depth - 1)
            // This requires a more complex algorithm in a real implementation
            // Simplified version here
          }
          
          // Determine category for this line item
          let categoryId: number | null = null;
          if (depth === 0) {
            // This is a top-level category
            const categories = await tx.select()
              .from(financialCategories)
              .where(eq(financialCategories.name, lineItem));
              
            if (categories.length > 0) {
              categoryId = categories[0].id;
            }
          } else {
            // Inherit category from parent or determine based on context
            // Simplified for now
          }
          
          // Store the line item
          const [lineItemEntry] = await tx.insert(financialLineItems).values({
            name: lineItem,
            path: rawLineItem, // Store the raw line item with spaces for hierarchical rendering
            depth: depth,
            parentId: parentId,
            categoryId: categoryId,
            rowType: rowType,
            uploadId: uploadId,
            createdAt: new Date()
          }).returning();
          
          // Store the line item ID for potential child references
          if (lineItemEntry) {
            lineItemMap.set(rawLineItem, lineItemEntry.id);
          }
          
          // Store financial values for each entity column
          for (const header of entityColumns) {
            const value = row[header] || '';
            const numericValue = parseFinancialValue(value);
            
            if (lineItemEntry) {
              await tx.insert(financialValues).values({
                lineItemId: lineItemEntry.id,
                entityName: header,
                originalValue: value,
                numericValue: numericValue,
                month: month || null,
                year: new Date().getFullYear(),
                fileType: type,
                uploadId: uploadId,
                createdAt: new Date()
              });
            }
          }
          
          rowIndex++;
        }
        
        console.log(`Successfully processed ${rowIndex} line items`);
        
        // Mark the upload as processed
        await tx.update(csvUploads)
          .set({ processed: true })
          .where(eq(csvUploads.id, uploadId));
      });
      
      console.log(`Financial data successfully stored for upload ${uploadId}`);
      return true;
    } catch (error) {
      console.error('Error storing financial data:', error);
      return false;
    }
  }
  
  /**
   * Query financial data with advanced filtering options
   */
  static async queryFinancialData({
    category,
    lineItemPattern,
    month,
    year,
    entityNames,
    minDepth,
    maxDepth,
    fileType,
    limit = 1000
  }: {
    category?: string,
    lineItemPattern?: string,
    month?: string,
    year?: number,
    entityNames?: string[],
    minDepth?: number,
    maxDepth?: number,
    fileType?: CSVFileType,
    limit?: number
  }) {
    try {
      // Build the query based on provided filters
      let query = db.select({
        id: financialLineItems.id,
        name: financialLineItems.name,
        path: financialLineItems.path,
        depth: financialLineItems.depth,
        rowType: financialLineItems.rowType,
        categoryName: financialCategories.name,
        // Include other fields as needed
      })
      .from(financialLineItems)
      .leftJoin(financialCategories, eq(financialLineItems.categoryId, financialCategories.id))
      .limit(limit);
      
      // Apply filters
      const conditions = [];
      
      if (category) {
        conditions.push(eq(financialCategories.name, category));
      }
      
      if (lineItemPattern) {
        conditions.push(sql`${financialLineItems.name} ILIKE ${`%${lineItemPattern}%`}`);
      }
      
      if (minDepth !== undefined) {
        conditions.push(sql`${financialLineItems.depth} >= ${minDepth}`);
      }
      
      if (maxDepth !== undefined) {
        conditions.push(sql`${financialLineItems.depth} <= ${maxDepth}`);
      }
      
      // Apply combined conditions if any
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const lineItems = await query;
      
      // If entity names or month filters are provided, we need to fetch values separately
      if (lineItems.length > 0 && (entityNames?.length || month)) {
        const lineItemIds = lineItems.map(item => item.id);
        
        let valuesQuery = db.select()
          .from(financialValues)
          .where(sql`${financialValues.lineItemId} IN (${lineItemIds.join(',')})`);
        
        if (month) {
          valuesQuery = valuesQuery.where(eq(financialValues.month, month));
        }
        
        if (year) {
          valuesQuery = valuesQuery.where(eq(financialValues.year, year));
        }
        
        if (fileType) {
          valuesQuery = valuesQuery.where(eq(financialValues.fileType, fileType));
        }
        
        if (entityNames?.length) {
          valuesQuery = valuesQuery.where(sql`${financialValues.entityName} IN (${entityNames.join(',')})`);
        }
        
        const values = await valuesQuery;
        
        // Organize values by line item
        const valuesByLineItem = new Map<number, any[]>();
        for (const value of values) {
          if (!valuesByLineItem.has(value.lineItemId)) {
            valuesByLineItem.set(value.lineItemId, []);
          }
          valuesByLineItem.get(value.lineItemId)?.push(value);
        }
        
        // Attach values to line items
        for (const item of lineItems) {
          item.values = valuesByLineItem.get(item.id) || [];
        }
      }
      
      return lineItems;
    } catch (error) {
      console.error('Error querying financial data:', error);
      return [];
    }
  }
}

/**
 * Parses a raw financial value string to a number
 * Handles dollar signs, commas, parentheses for negative values
 */
function parseFinancialValue(value: string): number {
  if (!value || value.trim() === '' || value.trim() === '-') return 0;
  
  // Remove quotes, dollar signs, and commas
  let cleanValue = value.replace(/"/g, '').replace(/\$/g, '').replace(/,/g, '').trim();
  
  // Handle parentheses (negative values)
  if (cleanValue.startsWith('(') && cleanValue.endsWith(')')) {
    cleanValue = '-' + cleanValue.substring(1, cleanValue.length - 1);
  }
  
  // Convert to number
  const numValue = parseFloat(cleanValue);
  return isNaN(numValue) ? 0 : numValue;
}