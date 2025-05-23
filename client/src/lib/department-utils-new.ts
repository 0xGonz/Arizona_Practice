/**
 * Utility functions for extracting department performance data
 * from monthly CSV files (O-type files) for analytics dashboards
 */

import { getVerifiedDepartmentData } from "./department-data";

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
  console.log("Extracting simplified department data (only key metrics)");
  
  // Use the updated function to extract only key financial metrics
  return getVerifiedDepartmentData(monthlyData);
}