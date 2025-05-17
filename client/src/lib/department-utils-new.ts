/**
 * Utility functions for extracting department performance data
 * from monthly CSV files (O-type files) for analytics dashboards
 */

import { parseFinancialValue } from "./csv-parser";

/**
 * Handles department name standardization to ensure consistent naming
 */
function standardizeDepartmentName(name: string): string {
  // Remove extra whitespace and standardize case
  const trimmed = name.trim().replace(/\s+/g, ' ');
  
  // Return standardized name
  return trimmed;
}

/**
 * Safely converts a value to a number, handling various formats
 */
function safeParseFloat(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  // Handle string values with special characters
  const cleanValue = String(value)
    .replace(/[$,\s]/g, '')
    .replace(/\(([^)]+)\)/, '-$1'); // Convert (123) to -123
    
  return parseFloat(cleanValue) || 0;
}

/**
 * Extracts department performance data from monthly business CSV data
 * This function focuses only on the three key metrics: Total Revenue, Total Operating Expenses, Net Income (Loss)
 */
export function extractDepartmentPerformanceData(monthlyData: any) {
  console.log("Extracting department data from monthly files");
  
  const result = [];
  
  // Process all available months
  for (const month in monthlyData) {
    if (!monthlyData[month]?.o?.lineItems || !monthlyData[month]?.o?.entityColumns) {
      continue;
    }
    
    const lineItems = monthlyData[month].o.lineItems;
    const entityColumns = monthlyData[month].o.entityColumns.filter(
      (col: string) => col !== 'Line Item' && col.trim() !== ''
    );
    
    // Find the total revenue, total expenses and net income rows
    const totalRevenueRow = lineItems.find((item: any) => 
      item['Line Item']?.toLowerCase().includes('total revenue'));
    
    const totalExpensesRow = lineItems.find((item: any) => 
      item['Line Item']?.toLowerCase().includes('total operating expenses') || 
      item['Line Item']?.toLowerCase().includes('total expense'));
    
    const netIncomeRow = lineItems.find((item: any) => 
      item['Line Item']?.toLowerCase().includes('net income') || 
      item['Line Item']?.toLowerCase().includes('net profit'));
    
    if (!totalRevenueRow || !totalExpensesRow || !netIncomeRow) {
      console.warn(`Missing key financial rows for ${month}`);
      continue;
    }
    
    // For each department/business line, extract financial data
    for (const department of entityColumns) {
      const departmentName = standardizeDepartmentName(department);
      
      // Skip empty columns
      if (!departmentName) continue;
      
      // Extract revenue, expenses and net income
      const revenue = parseFinancialValue(totalRevenueRow[department] || '0');
      const expenses = parseFinancialValue(totalExpensesRow[department] || '0');
      const netIncome = parseFinancialValue(netIncomeRow[department] || '0');
      
      result.push({
        name: departmentName,
        month: month.toLowerCase(),
        revenue,
        expenses,
        netIncome
      });
    }
  }
  
  return result;
}